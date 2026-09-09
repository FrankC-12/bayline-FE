"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ChevronLeft, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useServiceOrder } from "@/hooks/useServiceOrder";
import { useVehicleLookup } from "@/hooks/useVehicleLookUp";
import { useUsers } from "@/hooks/useUser";
import { useRoles } from "@/hooks/useRoles";
import { useBays } from "@/hooks/useBays";
import { useInspectionForOrder } from "@/hooks/useInspectionForOrder";
import { useInspections } from "@/hooks/useInspections";
import { useOrderSummary } from "@/hooks/useOrderSummary";
import TasksCard from "./TaskCard";
import TransfersCard from "./TransferCard";
import PriceSummaryCard from "./PriceSummaryCard";
import BillingModal from "./BillingModal";
import { closeServiceOrder } from "@/lib/api/serviceOrderBilling";
import { formatElapsed } from "@/lib/time";

const STATUS_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  completado: "Completado",
  orden_cerrada: "Orden cerrada",
  cancelado: "Cancelado",
};

const STATUS_STYLES: Record<string, string> = {
  pendiente: "bg-amber-100 text-amber-700",
  en_progreso: "bg-blue-light text-blue",
  completado: "bg-emerald-100 text-emerald-700",
  orden_cerrada: "bg-slate-100 text-slate-600",
  cancelado: "bg-red-100 text-red-700",
};

const TYPE_LABELS: Record<string, string> = { regular: "Regular", mpt: "MPT" };

interface OrderDetailProps {
  orderId: string;
}

export default function OrderDetail({ orderId }: OrderDetailProps) {
  const router = useRouter();
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;

  const { order, loading, error, update, refresh: refreshOrder } = useServiceOrder(orderId);
  const { vehicleMap } = useVehicleLookup(filialId);
  const { users } = useUsers({ filialId });
  const { roles } = useRoles("filial");
  const { bays } = useBays(filialId);
  const { inspection, link } = useInspectionForOrder(order?.id ?? null);
  const { inspections: unlinkedInspections } = useInspections(filialId, true);
  const { summary, refresh: refreshSummary, addTask, toggleTaskStatus, removeTask, addTransferLine, markOrdered } =
    useOrderSummary(order?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [billingOpen, setBillingOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const technicianRoleId = roles.find((r) => r.slug === "tecnico")?.id;
  const technicians = users.filter((u) => u.role_id === technicianRoleId);

  if (loading) {
    return <div className="p-12 text-center text-sm text-steel">Cargando orden...</div>;
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
        <h1 className="mt-4 font-display text-xl font-bold text-navy">No se pudo cargar la orden</h1>
        <p className="mt-2 text-sm text-steel">
          La orden de servicio no existe, fue eliminada, o el enlace es inválido.
        </p>
        <Link
          href="/dashboard/servicios"
          className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy"
        >
          <ChevronLeft className="h-4 w-4" />
          Volver a Órdenes de Servicio
        </Link>
      </div>
    );
  }

  const info = vehicleMap.get(order.vehicle_id);
  const readOnly = !!order.invoiced_at || order.status === "orden_cerrada" || order.status === "cancelado";

  async function finishOrder() {
    if (!order?.invoiced_at || order.status !== "completado") return;
    setSaving(true); setActionError(null);
    try { await closeServiceOrder(orderId); await refreshOrder(); await refreshSummary(); }
    catch (err) { setActionError(err instanceof Error ? err.message : "No se pudo cerrar la orden."); }
    finally { setSaving(false); }
  }

  async function transition(status: string) {
    if (readOnly) return;
    setSaving(true);
    try {
      await update({ status });
      await refreshSummary();
    } finally {
      setSaving(false);
    }
  }

  async function changeDiscount(discount_label: import("@/lib/partsPricing").DiscountLabel) {
    if (readOnly) return;
    setSaving(true);
    try {
      await update({ discount_label });
      await refreshSummary();
    } finally {
      setSaving(false);
    }
  }

  async function assignTechnician(value: string) {
    if (readOnly) return;
    setSaving(true);
    try {
      await update(value === "" ? { clear_technician: true } : { technician_user_id: value });
    } finally {
      setSaving(false);
    }
  }

  async function assignBay(value: string) {
    if (readOnly) return;
    setSaving(true);
    try {
      await update(value === "" ? { clear_bay: true } : { bay_id: value });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <button
        onClick={() => router.push("/dashboard/servicios")}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-steel hover:text-navy"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver a Órdenes de Servicio
      </button>

      <div className="rounded-2xl border border-navy/10 bg-white p-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-lg font-bold text-blue">{order.code}</span>
          <span
            className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest ${STATUS_STYLES[order.status]}`}
          >
            {STATUS_LABELS[order.status]}
          </span>
          <span className="rounded-full bg-ash px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-steel">
            {TYPE_LABELS[order.order_type]}
          </span>
          <span className="flex items-center gap-1 rounded-full border border-navy/15 px-2.5 py-1 font-mono text-xs text-navy">
            <Clock className="h-3.5 w-3.5" />
            {formatElapsed(order.created_at, order.closed_at)}
          </span>
        </div>

        <h1 className="mt-3 font-display text-2xl font-bold text-navy">
          {info ? `${info.vehicle.brand} ${info.vehicle.model}` : "Vehículo"}
        </h1>
        <p className="text-sm text-steel">
          {info?.vehicle.plate} · {info?.client.full_name}
        </p>

        <div className="mt-5 flex flex-wrap gap-3 border-t border-navy/10 pt-5">
          {order.status === "pendiente" && (
            <button
              onClick={() => transition("en_progreso")}
              disabled={saving || readOnly}
              className="rounded-full bg-blue px-5 py-2 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-60"
            >
              Iniciar
            </button>
          )}
          {order.status === "en_progreso" && (
            <button
              onClick={() => transition("completado")}
              disabled={saving || readOnly}
              className="rounded-full bg-blue px-5 py-2 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-60"
            >
              Marcar como completado
            </button>
          )}
          {order.status === "completado" && <>
            <button onClick={() => setBillingOpen(true)} disabled={saving}
              className="rounded-full bg-blue px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {order.invoiced_at ? "Ver factura y cobro" : "Facturar"}
            </button>
            <button onClick={finishOrder} disabled={saving || !order.invoiced_at}
              title={!order.invoiced_at ? "Primero debes facturar y registrar el cobro" : undefined}
              className="rounded-full bg-navy px-5 py-2 text-sm font-semibold text-white disabled:opacity-40">
              Cerrar orden
            </button>
          </>}
          {order.status === "orden_cerrada" && order.invoiced_at && <button onClick={() => setBillingOpen(true)}
            className="rounded-full border border-blue px-5 py-2 text-sm font-semibold text-blue">Ver factura y cobro</button>}
          {actionError && <p role="alert" className="w-full text-sm text-red-600">{actionError}</p>}
          {(order.status === "pendiente" || order.status === "en_progreso") && (
            <button
              onClick={() => transition("cancelado")}
              disabled={saving || readOnly}
              className="rounded-full border border-red-200 px-5 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
            >
              Cancelar orden
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-navy/10 bg-white p-6">
        <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-steel">Datos de recepción</p>
        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-steel">Kilometraje de ingreso</p>
            <p className="mt-0.5 text-sm font-semibold text-navy">
              {order.intake_mileage != null ? `${order.intake_mileage.toLocaleString("es-VE")} km` : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-steel">Asesor responsable</p>
            <p className="mt-0.5 text-sm font-semibold text-navy">
              {users.find((u) => u.id === order.advisor_user_id)?.full_name ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-steel">Fecha prometida de entrega</p>
            <p className="mt-0.5 text-sm font-semibold text-navy">
              {order.promised_at ? new Date(`${order.promised_at}T12:00:00`).toLocaleDateString("es-VE") : "—"}
            </p>
          </div>
          <div className="sm:col-span-1">
            <p className="text-xs text-steel">Motivo del cliente</p>
            <p className="mt-0.5 text-sm font-semibold text-navy">{order.customer_reason ?? "—"}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-navy/10 bg-white p-5">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-steel">
            Técnico asignado
          </p>
          <select
            disabled={readOnly || saving}
            value={order.technician_user_id ?? ""}
            onChange={(e) => assignTechnician(e.target.value)}
            className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
          >
            <option value="">Sin asignar</option>
            {technicians.map((t) => (
              <option key={t.id} value={t.id}>
                {t.full_name}
              </option>
            ))}
          </select>

          <p className="mb-3 mt-5 font-mono text-[11px] uppercase tracking-widest text-steel">
            Bahía a utilizar
          </p>
          <select
            disabled={readOnly || saving}
            value={order.bay_id ?? ""}
            onChange={(e) => assignBay(e.target.value)}
            className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
          >
            <option value="">Sin asignar</option>
            {bays.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-2xl border border-navy/10 bg-white p-5">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-steel">
            Vehículo asignado
          </p>
          {info ? (
            <div>
              <p className="font-display font-bold text-navy">
                {info.vehicle.brand} {info.vehicle.model}
              </p>
              <p className="font-mono text-sm text-blue">{info.vehicle.plate}</p>
              <p className="mt-1 text-sm text-steel">{info.client.full_name}</p>
            </div>
          ) : (
            <p className="text-sm text-steel">Vehículo no encontrado</p>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-navy/10 bg-white p-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-display text-sm font-bold text-navy">Inspección Preliminar</p>
            {inspection && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-emerald-700">
                Vinculada
              </span>
            )}
          </div>

          {inspection ? (
            <p className="text-sm text-steel">
              {inspection.notes || "Sin notas."}
              {inspection.mileage ? ` ${inspection.mileage.toLocaleString("es-VE")} km.` : ""}
            </p>
          ) : (
            (() => {
              const candidates = unlinkedInspections.filter((i) => i.vehicle_id === order.vehicle_id);
              if (candidates.length === 0) {
                return <p className="text-sm text-steel">Sin inspección preliminar vinculada.</p>;
              }
              return (
                <div className="space-y-2">
                  <p className="text-sm text-steel">Hay inspecciones de este vehículo sin vincular:</p>
                  {candidates.map((c) => (
                    <button
                      key={c.id}
                      disabled={readOnly || saving}
                      onClick={() => { if (!readOnly) void link(c.id); }}
                      className="flex w-full items-center justify-between rounded-xl border border-navy/10 px-3 py-2 text-left text-sm transition hover:bg-ash"
                    >
                      <span className="text-steel">
                        {new Date(c.created_at).toLocaleString("es-VE")}
                      </span>
                      <span className="font-semibold text-blue">Vincular</span>
                    </button>
                  ))}
                </div>
              );
            })()
          )}
        </div>
        <div className="rounded-2xl border border-dashed border-navy/20 bg-ash/50 p-5">
          <p className="font-display text-sm font-bold text-navy">Inspección Minuciosa</p>
          <p className="mt-1 text-sm text-steel">El técnico aún no ha realizado la inspección minuciosa.</p>
        </div>
      </div>

      {readOnly && <p role="status" className="mt-6 rounded-xl bg-ash px-4 py-3 text-sm text-steel">
        Esta orden es de solo lectura.{(order.invoiced_at || order.status === "orden_cerrada") ? " El precio quedó congelado al facturar." : ""}
      </p>}
      {filialId && (
        <div className="mt-6">
          <TasksCard
            readOnly={readOnly || saving}
            filialId={filialId}
            tasks={summary?.tasks ?? []}
            onAdd={addTask}
            onToggleStatus={toggleTaskStatus}
            onRemove={removeTask}
          />
        </div>
      )}

      {filialId && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <TransfersCard
            readOnly={readOnly || saving}
            filialId={filialId}
            transfers={summary?.transfers ?? []}
            onAddLine={addTransferLine}
            onMarkOrdered={markOrdered}
          />
          {summary && <PriceSummaryCard summary={summary} totalAmount={order.total_amount} onDiscountChange={changeDiscount} saving={saving} readOnly={readOnly} />}
        </div>
      )}
      {billingOpen && <BillingModal orderId={orderId} orderCode={order.code} invoiced={!!order.invoiced_at}
        onClose={() => setBillingOpen(false)} onInvoiced={async () => { await refreshOrder(); await refreshSummary(); }} />}
    </div>
  );
}