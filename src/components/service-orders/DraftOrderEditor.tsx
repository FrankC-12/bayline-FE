"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useVehicleLookup } from "@/hooks/useVehicleLookUp";
import { useUserDirectory } from "@/hooks/useUserDirectory";
import { useRoleDirectory } from "@/hooks/useRoleDirectory";
import { useParts } from "@/hooks/useParts";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import { useBays } from "@/hooks/useBays";
import { useOrderSummary } from "@/hooks/useOrderSummary";
import {
  saveOrderDraft,
  submitOrderDraft,
  discardOrderDraft,
  type DraftFields,
} from "@/lib/api/serviceOrders";
import { formatMoney } from "@/lib/format";
import type { ServiceOrder } from "@/types/serviceOrder";
import TasksCard from "./TaskCard";
import ErrorState from "@/components/common/ErrorState";
import OrderStages from "./OrderStages";
import ConfirmDialog from "@/components/common/ConfirmDialog";

export default function DraftOrderEditor({
  order,
  onSubmitted,
}: {
  order: ServiceOrder;
  onSubmitted: () => Promise<void>;
}) {
  const router = useRouter();
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;
  const { canEdit } = useModuleAccess("asesor-servicios");
  const { parts } = useParts(filialId, undefined, true);
  const { vehicleMap } = useVehicleLookup(filialId);
  const { users } = useUserDirectory({ filialId });
  const { roles } = useRoleDirectory("filial");
  const { bays } = useBays(filialId);
  const {
    summary,
    addTask,
    removeTask,
    error: summaryError,
    refresh: refreshSummary,
  } = useOrderSummary(order.id);
  const [fields, setFields] = useState<DraftFields>({
    vehicle_id: order.vehicle_id || null,
    technician_user_id: order.technician_user_id,
    bay_id: order.bay_id,
    customer_reason: order.customer_reason || "",
    scheduled_at: order.scheduled_at,
  });
  const latest = useRef(fields);
  latest.current = fields;
  const revision = useRef(order.draft_revision ?? 1);
  const chain = useRef<Promise<unknown>>(Promise.resolve());
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saveState, setSaveState] = useState("Guardado");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const saveRef = useRef<(value: DraftFields) => Promise<void>>(async () => {});
  saveRef.current = (snapshot) => {
    setSaveState("Guardando…");
    const operation = chain.current
      .catch(() => undefined)
      .then(async () => {
        try {
          const saved = await saveOrderDraft(order.id, {
            ...snapshot,
            expected_revision: revision.current,
          });
          revision.current = saved.draft_revision ?? revision.current + 1;
          if (JSON.stringify(snapshot) === JSON.stringify(latest.current)) {
            dirty.current = false;
            setSaveState("Guardado");
          }
          setError(null);
        } catch (e) {
          setSaveState("Sin guardar");
          setError(e instanceof Error ? e.message : "No se pudo guardar.");
          throw e;
        }
      });
    chain.current = operation;
    return operation;
  };
  useEffect(() => {
    if (!dirty.current) return;
    timer.current = setTimeout(() => {
      void saveRef.current({ ...latest.current }).catch(() => undefined);
    }, 650);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [fields]);
  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      if (dirty.current)
        void saveRef.current({ ...latest.current }).catch(() => undefined);
    };
  }, []);
  const change = (patch: Partial<DraftFields>) => {
    dirty.current = true;
    setSaveState("Sin guardar");
    setFields((v) => ({ ...v, ...patch }));
  };
  const info = fields.vehicle_id ? vehicleMap.get(fields.vehicle_id) : null;
  const technicianRole = roles.find((r) => r.slug === "tecnico")?.id;
  const technicians = users.filter((u) => u.role_id === technicianRole);
  async function send() {
    if (timer.current) clearTimeout(timer.current);
    setBusy(true);
    try {
      await saveRef.current({ ...latest.current });
      await submitOrderDraft(order.id);
      await onSubmitted();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo enviar al taller.");
    } finally {
      setBusy(false);
    }
  }
  async function discard() {
    if (timer.current) clearTimeout(timer.current);
    dirty.current = false;
    setBusy(true);
    try {
      await chain.current.catch(() => undefined);
      await discardOrderDraft(order.id);
      router.replace("/dashboard/servicios");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo descartar.");
      setBusy(false);
      setConfirmDiscard(false);
    }
  }
  const count =
    summary?.tasks.filter((t) => t.status !== "cancelada").length ?? 0;
  return (
    <div className="space-y-4">
      <Link href="/dashboard/servicios" className="text-sm text-steel">
        ‹ Órdenes de servicio
      </Link>
      <section className="rounded-2xl border border-navy/10 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-sm font-bold text-blue">
            {order.code}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-steel">
            Borrador
          </span>
          <span aria-live="polite" className="text-xs text-steel">
            {saveState} · Se guarda solo
          </span>
          <button
            disabled={busy || !canEdit}
            onClick={() => setConfirmDiscard(true)}
            className="ml-auto rounded-full border border-red-200 px-3 py-2 text-xs text-red-700"
          >
            Descartar borrador
          </button>
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold text-navy">
          {info
            ? `${info.vehicle.brand} ${info.vehicle.model} ${info.vehicle.year ?? ""}`
            : "Selecciona el vehículo"}
        </h1>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <label className="text-xs text-steel">
            Vehículo y cliente
            <select
              aria-label="Vehículo del borrador"
              value={fields.vehicle_id ?? ""}
              disabled={busy || !canEdit || count > 0}
              onChange={(e) => change({ vehicle_id: e.target.value || null })}
              className="mt-1 w-full rounded-lg border border-navy/15 bg-white p-2 text-sm text-navy"
            >
              <option value="">Seleccionar vehículo</option>
              {Array.from(vehicleMap.values()).map((v) => (
                <option key={v.vehicle.id} value={v.vehicle.id}>
                  {v.vehicle.brand} {v.vehicle.model} ·{" "}
                  {v.vehicle.plate || "Sin placa"} · {v.client.full_name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-steel">
            Técnico
            <select
              aria-label="Técnico del borrador"
              disabled={busy || !canEdit}
              value={fields.technician_user_id ?? ""}
              onChange={(e) =>
                change({ technician_user_id: e.target.value || null })
              }
              className="mt-1 w-full rounded-lg border border-navy/15 bg-white p-2 text-sm text-navy"
            >
              <option value="">Sin asignar</option>
              {technicians.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-steel">
            Bahía
            <select
              aria-label="Bahía del borrador"
              disabled={busy || !canEdit}
              value={fields.bay_id ?? ""}
              onChange={(e) => change({ bay_id: e.target.value || null })}
              className="mt-1 w-full rounded-lg border border-navy/15 bg-white p-2 text-sm text-navy"
            >
              <option value="">Sin asignar</option>
              {bays
                .filter((b) => b.is_active)
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
            </select>
          </label>
        </div>
        <OrderStages
          cancelled={false}
          complete={[false, count > 0, false, false, false, false, false]}
        />
      </section>
      {error && (
        <div
          role="alert"
          className="rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
          <button
            className="ml-3 underline"
            onClick={() =>
              void saveRef.current({ ...latest.current }).catch(() => undefined)
            }
          >
            Reintentar guardado
          </button>
        </div>
      )}
      {summaryError && (
        <ErrorState error={summaryError} onRetry={refreshSummary} />
      )}
      <div className="grid items-start gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-navy/10 bg-white p-5">
          <div className="flex justify-between gap-3">
            <h2 className="text-sm font-bold text-navy">
              Inspección preliminar
            </h2>
            <span className="rounded-full bg-amber-50 px-2 py-1 text-xs text-amber-800">
              Pendiente
            </span>
          </div>
          <label className="mt-3 block text-xs text-steel">
            Motivo del cliente
            <textarea
              disabled={busy || !canEdit}
              value={fields.customer_reason}
              onChange={(e) => change({ customer_reason: e.target.value })}
              placeholder="Ej: ruido al frenar"
              className="mt-2 w-full rounded-xl border border-navy/15 p-3 text-sm text-navy"
              rows={3}
            />
          </label>
          <p className="mt-3 flex justify-between gap-3 text-xs text-steel">
            <span>Km y daños</span>
            <b>Se cargan desde la app</b>
          </p>
        </section>
        <section className="rounded-2xl border border-navy/10 bg-white p-5">
          <div className="flex justify-between">
            <h2 className="text-sm font-bold text-navy">
              Inspección minuciosa
            </h2>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-steel">
              Aún no
            </span>
          </div>
          <p className="mt-3 text-xs text-steel">
            El técnico registrará la inspección desde la app.
          </p>
        </section>
        <TasksCard
          readOnly={busy || !canEdit || !fields.vehicle_id}
          filialId={order.filial_id}
          orderId={order.id}
          tasks={summary?.tasks ?? []}
          onAdd={async (id, _payer, expectedTotal) => {
            await saveRef.current({ ...latest.current });
            await addTask(id, "cliente", expectedTotal);
          }}
          onRemove={removeTask}
        />
        <section className="rounded-2xl border border-navy/10 bg-white p-5">
          <h2 className="text-sm font-bold text-navy">Repuestos</h2>
          {!summary?.transfers.length ? (
            <p className="mt-4 rounded-xl border border-dashed border-navy/15 p-5 text-center text-xs text-steel">
              Se agregan solos con cada tarea
            </p>
          ) : (
            summary.transfers.map((t) => (
              <div
                key={t.id}
                className="mt-3 rounded-xl border border-navy/10 p-3"
              >
                <p className="text-xs font-semibold text-navy">
                  {t.code}{" "}
                  <span className="ml-2 rounded-full bg-slate-100 px-2 py-1 text-steel">
                    Sin pedir
                  </span>
                </p>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-navy/10 text-[10px] uppercase text-steel">
                      <tr>
                        <th className="py-2 pr-2">Repuesto</th>
                        <th className="py-2 px-2 text-right">Cant.</th>
                        <th className="py-2 px-2 text-right">Precio u.</th>
                        <th className="py-2 pl-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {t.lines.map((line) => (
                        <tr
                          key={line.id}
                          className="border-b border-navy/5 last:border-0"
                        >
                          <td className="py-3 pr-2 text-navy">
                            {parts.find((p) => p.id === line.part_id)?.name ??
                              "Repuesto"}
                          </td>
                          <td className="px-2 py-3 text-right">
                            {line.quantity}
                          </td>
                          <td className="px-2 py-3 text-right">
                            ${formatMoney(line.unit_price ?? 0)}
                          </td>
                          <td className="pl-2 py-3 text-right font-semibold text-navy">
                            ${formatMoney(line.subtotal ?? 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </section>
      </div>
      <section className="rounded-2xl border border-navy/10 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-navy">Total del cliente</h2>
          <button
            disabled={
              busy ||
              !canEdit ||
              !fields.vehicle_id ||
              !fields.technician_user_id ||
              count === 0
            }
            onClick={() => void send()}
            className="rounded-full bg-blue px-5 py-2.5 text-sm font-semibold text-white disabled:bg-slate-200 disabled:text-steel"
          >
            {busy ? "Enviando…" : "Enviar al taller"}
          </button>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { label: "Repuestos", value: summary?.parts_subtotal ?? 0 },
            { label: "Mano de obra", value: summary?.labor_subtotal ?? 0 },
            {
              label: "Subtotal",
              value:
                (summary?.parts_subtotal ?? 0) + (summary?.labor_subtotal ?? 0),
            },
            {
              label: `IVA ${summary?.iva_percentage ?? 16}%`,
              value: summary?.iva_amount ?? 0,
            },
            { label: "Estimado", value: summary?.total ?? 0 },
          ].map((v) => (
            <div
              key={v.label}
              className={`rounded-xl p-3 ${v.label === "Estimado" ? "bg-blue-light" : "bg-slate-50"}`}
            >
              <dt className="text-[10px] uppercase tracking-wider text-steel">
                {v.label}
              </dt>
              <dd className="mt-1 font-semibold text-navy">
                ${formatMoney(v.value)}
              </dd>
            </div>
          ))}
        </dl>
      </section>
      <ConfirmDialog
        open={confirmDiscard}
        title="Descartar borrador"
        description="Se eliminará este borrador. No se enviará al taller ni se moverá inventario."
        confirmLabel="Descartar borrador"
        onCancel={() => setConfirmDiscard(false)}
        onConfirm={() => void discard()}
      />
    </div>
  );
}
