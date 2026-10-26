"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Modal from "@/components/common/Modal";
import { useAuth } from "@/contexts/AuthContext";
import { useUpsellsContext } from "@/contexts/UpsellsContext";
import { useServiceOrders } from "@/hooks/useServiceOrders";
import { useVehicleLookup } from "@/hooks/useVehicleLookUp";
import { useUserDirectory } from "@/hooks/useUserDirectory";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import { quoteUpsell, type DecideUpsellInput } from "@/lib/api/upsells";
import { formatEntryDate, formatEntryDateTime } from "@/lib/format";
import type { Upsell, UpsellApprovalChannel } from "@/types/upsells";
import DiscardUpsellModal from "./DiscardUpsellModal";
const money = (v: number) =>
  `$${v.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const severities = {
  urgente: ["Urgente", "bg-red-100 text-red-700"],
  pronto: ["Recomendado", "bg-amber-100 text-amber-800"],
  monitorear: ["Monitorear", "bg-slate-100 text-steel"],
};
export default function UpsellsView() {
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;
  const { upsells, loading, error, decide } = useUpsellsContext();
  const { orders } = useServiceOrders(filialId, "all");
  const { vehicleMap } = useVehicleLookup(filialId);
  const { users } = useUserDirectory({ filialId });
  const { canEdit } = useModuleAccess("asesor-servicios");
  const [tab, setTab] = useState<"pending" | "later" | "history">("pending"),
    [search, setSearch] = useState("");
  const [quotes, setQuotes] = useState<Record<string, number | null>>({});
  const [approve, setApprove] = useState<Upsell | null>(null),
    [discard, setDiscard] = useState<Upsell | null>(null),
    [channel, setChannel] = useState<UpsellApprovalChannel>("presencial"),
    [busy, setBusy] = useState<string | null>(null),
    [actionError, setActionError] = useState("");
  useEffect(() => {
    let live = true;
    Promise.all(
      upsells.map(async (u) => {
        if (u.status === "aprobado" || u.status === "rechazado")
          return [u.id, u.approved_amount ?? u.amount] as const;
        try {
          const q = await quoteUpsell(u.id);
          return [u.id, q.has_work && q.total > 0 ? q.total : null] as const;
        } catch {
          return [u.id, null] as const;
        }
      }),
    ).then((rows) => {
      if (live) setQuotes(Object.fromEntries(rows));
    });
    return () => {
      live = false;
    };
  }, [upsells]);
  const order = (u: Upsell) => orders.find((o) => o.id === u.service_order_id);
  const entry = (u: Upsell) => {
    const o = order(u);
    return o ? vehicleMap.get(o.vehicle_id ?? "") : undefined;
  };
  const name = (id: string | null) =>
    users.find((u) => u.id === id)?.full_name ?? "Sin registrar";
  const editable = (u: Upsell) => {
    const o = order(u);
    return (
      !!o &&
      !o.is_draft &&
      !o.invoiced_at &&
      !["orden_cerrada", "cancelado"].includes(o.status)
    );
  };
  const groups = {
    pending: upsells.filter((u) => u.status === "pendiente" && editable(u)),
    later: upsells.filter((u) => u.status === "pospuesto"),
    history: upsells.filter((u) =>
      ["aprobado", "rechazado"].includes(u.status),
    ),
  };
  const month = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Caracas",
    year: "numeric",
    month: "2-digit",
  }).format(new Date());
  const monthOf = (v: string) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Caracas",
      year: "numeric",
      month: "2-digit",
    }).format(new Date(v));
  const answered = upsells.filter(
    (u) =>
      u.resolved_at &&
      monthOf(u.resolved_at) === month &&
      u.status !== "pendiente",
  );
  const accepted = answered.filter((u) => u.status === "aprobado");
  const sum = (list: Upsell[]) =>
    list.reduce((v, u) => v + (quotes[u.id] ?? 0), 0);
  const rows = groups[tab].filter((u) => {
    const v = entry(u);
    return `${u.title} ${v?.vehicle.brand} ${v?.vehicle.model} ${v?.vehicle.plate} ${v?.client.full_name} ${name(u.detected_by_user_id)} ${order(u)?.code}`
      .toLowerCase()
      .includes(search.toLowerCase());
  });
  async function act(u: Upsell, input: DecideUpsellInput) {
    setBusy(u.id);
    setActionError("");
    try {
      await decide(u.id, input);
      setApprove(null);
      setDiscard(null);
    } catch (e) {
      setActionError(
        e instanceof Error ? e.message : "No se pudo registrar la respuesta.",
      );
    } finally {
      setBusy(null);
    }
  }
  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-3xl font-bold text-navy">Upsells</h1>
        <p className="mt-2 text-sm text-steel">
          Trabajos extra que encuentran los técnicos en la app.
        </p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Aceptación · este mes",
            value: answered.length
              ? `${Math.round((accepted.length / answered.length) * 100)} %`
              : "—",
            note: `${accepted.length} de ${answered.length} respondidos`,
            tone: "",
          },
          {
            label: "Vendido · este mes",
            value: money(sum(accepted)),
            note: "",
            tone: "text-emerald-700",
          },
          {
            label: "Por preguntar · este mes",
            value: money(
              sum(
                groups.pending.filter((u) => monthOf(u.created_at) === month),
              ),
            ),
            note: "",
            tone: "text-amber-800 bg-amber-50",
          },
          {
            label: "Para después · este mes",
            value: money(
              sum(
                groups.later.filter(
                  (u) => monthOf(u.resolved_at ?? u.created_at) === month,
                ),
              ),
            ),
            note: "",
            tone: "",
          },
        ].map((k) => (
          <div
            key={k.label}
            className={`rounded-2xl border border-navy/10 bg-white p-5 ${k.tone}`}
          >
            <p className="text-xs text-steel">{k.label}</p>
            <p className="mt-2 text-2xl font-bold">{k.value}</p>
            {k.note && <p className="mt-1 text-xs text-steel">{k.note}</p>}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-full bg-slate-100 p-1">
          {(
            [
              ["pending", "Por preguntar"],
              ["later", "Para después"],
              ["history", "Historial"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-full px-4 py-2 text-xs ${tab === key ? "bg-white font-semibold text-navy shadow-sm" : "text-steel"}`}
            >
              {label}{" "}
              <span className="ml-1 rounded-full bg-slate-100 px-2">
                {groups[key].length}
              </span>
            </button>
          ))}
        </div>
        <input
          aria-label="Buscar upsells"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por placa, cliente, técnico u ODS"
          className="min-w-0 flex-1 rounded-full border border-navy/10 bg-white px-4 py-2.5 text-sm"
        />
      </div>
      {(error || actionError) && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
        >
          {actionError || error?.message}
        </p>
      )}
      <div className="overflow-x-auto rounded-2xl border border-navy/10 bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-navy/10 font-mono text-[10px] uppercase tracking-wider text-steel">
            <tr>
              {[
                "Fecha",
                "Trabajo",
                "Vehículo · cliente",
                "Técnico",
                "Monto",
                tab === "history"
                  ? "Respuesta registrada"
                  : "Respuesta del cliente",
              ].map((h) => (
                <th key={h} className="px-4 py-4">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => {
              const v = entry(u),
                o = order(u),
                severity = severities[u.severity];
              return (
                <tr key={u.id} className="border-b border-navy/5 last:border-0">
                  <td className="px-4 py-5 text-xs text-steel">
                    {formatEntryDate(u.created_at)}
                  </td>
                  <td className="max-w-xs px-4 py-5">
                    <p className="font-semibold text-navy">
                      {u.title}{" "}
                      <span
                        className={`ml-1 inline-block rounded-full px-2 py-1 text-[10px] ${severity[1]}`}
                      >
                        {severity[0]}
                      </span>
                    </p>
                    <p className="mt-1 whitespace-pre-wrap break-words text-xs text-steel">
                      {u.description}
                    </p>
                    <Link
                      href={`/dashboard/servicios/${u.service_order_id}`}
                      className="mt-1 inline-block font-mono text-xs text-blue underline"
                    >
                      {o?.code ?? "Ver ODS"}
                    </Link>
                    {u.photo_urls.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {u.photo_urls.map((url, i) => (
                          <a
                            key={url}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-blue underline"
                          >
                            Foto {i + 1}
                          </a>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-5">
                    <p className="font-semibold text-navy">
                      {v ? `${v.vehicle.brand} ${v.vehicle.model}` : "Vehículo"}{" "}
                      <span className="font-mono text-xs font-normal">
                        {v?.vehicle.plate}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-steel">
                      {v?.client.full_name ?? "—"}
                    </p>
                    {tab === "later" && v?.client.phone_primary && (
                      <a
                        href={`tel:${v.client.phone_primary}`}
                        className="mt-1 block text-xs text-blue"
                      >
                        {v.client.phone_primary}
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-5 text-xs">
                    {name(u.detected_by_user_id)}
                  </td>
                  <td className="px-4 py-5 font-semibold text-navy">
                    {quotes[u.id] != null ? (
                      money(quotes[u.id]!)
                    ) : (
                      <span className="text-xs text-amber-800">
                        Revisar cotización
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-5">
                    {tab === "pending" ? (
                      <div className="flex flex-wrap gap-1">
                        <button
                          disabled={!canEdit || !!busy || quotes[u.id] == null}
                          onClick={() => {
                            setActionError("");
                            setApprove(u);
                          }}
                          className="rounded-full bg-blue px-3 py-2 text-xs text-white disabled:opacity-40"
                        >
                          Sí
                        </button>
                        <button
                          disabled={!canEdit || !!busy}
                          onClick={() => void act(u, { status: "pospuesto" })}
                          className="rounded-full border border-navy/15 px-3 py-2 text-xs"
                        >
                          Después
                        </button>
                        <button
                          disabled={!canEdit || !!busy}
                          onClick={() => setDiscard(u)}
                          className="rounded-full border border-navy/15 px-3 py-2 text-xs"
                        >
                          No
                        </button>
                      </div>
                    ) : tab === "later" ? (
                      canEdit && v ? (
                        <Link
                          href={`/dashboard/servicios/nueva?vehicle_id=${v.vehicle.id}&upsell_id=${u.id}`}
                          className="inline-block rounded-full bg-blue px-3 py-2 text-xs font-semibold text-white"
                        >
                          Crear ODS
                        </Link>
                      ) : (
                        <span className="text-xs text-steel">Pendiente</span>
                      )
                    ) : (
                      <div className="space-y-1 text-xs">
                        <b
                          className={
                            u.status === "aprobado"
                              ? "text-emerald-700"
                              : "text-steel"
                          }
                        >
                          {u.status === "aprobado" ? "Aprobado" : "Rechazado"}
                        </b>
                        <p>
                          {name(u.resolved_by_user_id ?? u.approved_by_user_id)}
                        </p>
                        <p className="text-steel">
                          {u.resolved_at
                            ? formatEntryDateTime(u.resolved_at)
                            : "Sin fecha"}
                        </p>
                        {u.discard_note && (
                          <p className="text-steel">{u.discard_note}</p>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {loading ? (
          <p className="p-8 text-center text-sm text-steel">
            Cargando hallazgos…
          </p>
        ) : (
          !rows.length && (
            <p className="p-8 text-center text-sm text-steel">
              No hay trabajos en esta bandeja.
            </p>
          )
        )}
      </div>
      <p className="text-xs text-steel">
        Montos estimados con el precio actual del servicio y sus repuestos. Las
        cotizaciones pendientes de revisión no se suman.
      </p>
      <Modal
        open={!!approve}
        onClose={() => {
          if (!busy) setApprove(null);
        }}
        title="Registrar aceptación"
        size="md"
      >
        <div className="space-y-4 p-6">
          <p className="text-sm text-navy">{approve?.title}</p>
          <label className="block text-sm">
            ¿Cómo aceptó el cliente?
            <select
              value={channel}
              onChange={(e) =>
                setChannel(e.target.value as UpsellApprovalChannel)
              }
              className="mt-2 w-full rounded-xl border border-navy/15 p-3"
            >
              {[
                ["presencial", "Presencial"],
                ["whatsapp", "WhatsApp"],
                ["llamada", "Llamada"],
                ["sms", "SMS"],
                ["correo", "Correo"],
              ].map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          {actionError && (
            <p role="alert" className="text-sm text-red-700">
              {actionError}
            </p>
          )}
          <button
            disabled={!!busy}
            onClick={() =>
              approve &&
              void act(approve, {
                status: "aprobado",
                approval_channel: channel,
              })
            }
            className="w-full rounded-full bg-blue p-3 font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Guardando…" : "Aceptar y agregar a la ODS"}
          </button>
        </div>
      </Modal>
      {discard && (
        <DiscardUpsellModal
          title={discard.title}
          submitting={!!busy}
          actionError={actionError}
          onClose={() => {
            if (!busy) setDiscard(null);
          }}
          onConfirm={(reason, note) =>
            void act(discard, {
              status: "rechazado",
              discard_reason: reason,
              discard_note: note,
            })
          }
        />
      )}
    </div>
  );
}
