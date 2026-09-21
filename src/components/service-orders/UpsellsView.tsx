"use client";

import { useMemo, useState } from "react";
import { Clock, Camera, Check, X, Loader2, Search, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUpsellsContext } from "@/contexts/UpsellsContext";
import { useServiceOrders } from "@/hooks/useServiceOrders";
import { useVehicleLookup } from "@/hooks/useVehicleLookUp";
import { useUserDirectory } from "@/hooks/useUserDirectory";
import { useTemparios } from "@/hooks/useTemparios";
import { useParts } from "@/hooks/useParts";
import type { Upsell, UpsellApprovalChannel } from "@/types/upsells";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";

const STATUS_LABELS: Record<string, string> = {
  aprobado: "Aprobado",
  pospuesto: "Pospuesto",
  rechazado: "Rechazado",
};

const STATUS_STYLES: Record<string, string> = {
  aprobado: "bg-emerald-100 text-emerald-700",
  pospuesto: "bg-amber-100 text-amber-700",
  rechazado: "bg-red-100 text-red-700",
};

const CHANNEL_OPTIONS: { value: UpsellApprovalChannel; label: string }[] = [
  { value: "presencial", label: "Presencial" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "llamada", label: "Llamada telefónica" },
  { value: "sms", label: "SMS" },
  { value: "correo", label: "Correo" },
];

const CHANNEL_LABELS: Record<UpsellApprovalChannel, string> = {
  presencial: "Presencial",
  whatsapp: "WhatsApp",
  llamada: "Llamada telefónica",
  sms: "SMS",
  correo: "Correo",
};

const usd = (value: number) => `$${value.toLocaleString("es-VE", { minimumFractionDigits: 2 })}`;

function upsellSummary(u: Upsell): string {
  const parts = [
    ...u.tasks.map((t) => `${t.code_snapshot} · ${t.name_snapshot}`),
    ...u.parts.map((p) => `${p.name_snapshot} ×${p.quantity}`),
  ];
  return parts.join(" · ");
}

export default function UpsellsView() {
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;

  const { upsells, loading, error, addUpsell, decide, refresh } = useUpsellsContext();
  const { orders } = useServiceOrders(filialId, "all");
  const { vehicleMap } = useVehicleLookup(filialId);
  const { users } = useUserDirectory({ filialId });
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [approvingUpsell, setApprovingUpsell] = useState<Upsell | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  const orderById = (id: string) => orders.find((o) => o.id === id);
  const vehicleLabel = (orderId: string) => {
    const order = orderById(orderId);
    if (!order) return "—";
    const entry = vehicleMap.get(order.vehicle_id);
    return entry ? `${entry.vehicle.brand} ${entry.vehicle.model} ${entry.vehicle.year}` : "—";
  };
  const technicianName = (id: string | null) => (id ? users.find((u) => u.id === id)?.full_name ?? "—" : "—");
  const isOrderEditable = (orderId: string) => {
    const order = orderById(orderId);
    return !!order && !order.invoiced_at && !["orden_cerrada", "cancelado"].includes(order.status);
  };

  const pending = upsells.filter((u) => u.status === "pendiente");
  const resolved = upsells.filter((u) => u.status !== "pendiente");

  const filteredResolved = useMemo(() => {
    if (!search) return resolved;
    const term = search.toLowerCase();
    return resolved.filter((u) => {
      const order = orderById(u.service_order_id);
      return (
        u.title.toLowerCase().includes(term) ||
        vehicleLabel(u.service_order_id).toLowerCase().includes(term) ||
        technicianName(u.detected_by_user_id).toLowerCase().includes(term) ||
        (order && order.code.toLowerCase().includes(term)) ||
        STATUS_LABELS[u.status]?.toLowerCase().includes(term)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolved, search, orders, vehicleMap, users]);

  async function handleAction(upsell: Upsell, status: "rechazado" | "pospuesto") {
    if (!isOrderEditable(upsell.service_order_id)) return;
    setActingId(upsell.id);
    try {
      await decide(upsell.id, { status });
    } finally {
      setActingId(null);
    }
  }

  async function handleApprove(upsell: Upsell, channel: UpsellApprovalChannel) {
    setActingId(upsell.id);
    try {
      await decide(upsell.id, { status: "aprobado", approval_channel: channel });
      setApprovingUpsell(null);
    } finally {
      setActingId(null);
    }
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold text-navy">Upsells</h1>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy"
        >
          <Plus className="h-4 w-4" />
          Nuevo upsell
        </button>
      </div>
      <p className="mb-6 text-sm text-steel">
        Trabajo adicional detectado por los técnicos · aprueba, posterga o consulta el histórico
      </p>

      {loading ? (
        <div className="rounded-2xl border border-navy/10 bg-white p-12 text-center text-sm text-steel">
          Cargando upsells...
        </div>
      ) : error ? (
        <ErrorState error={error} onRetry={refresh} />
      ) : (
        <>
          {pending.length > 0 && (
            <div className="mb-8 rounded-2xl border border-amber-300 bg-amber-50/60 p-6">
              <div className="mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-600" />
                <span className="font-display text-lg font-bold text-amber-700">Pendiente por Aprobación</span>
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-amber-500 px-1.5 text-xs font-bold text-white">
                  {pending.length}
                </span>
              </div>

              <div className="space-y-4">
                {pending.map((u, i) => (
                  <div
                    key={u.id}
                    className={`flex items-start justify-between gap-6 pt-4 ${i > 0 ? "border-t border-amber-200" : ""}`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-display text-lg font-bold text-navy">{u.title}</p>
                        <span className="rounded-full bg-blue-light px-2.5 py-1 text-xs font-bold text-blue">
                          {usd(u.amount)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-steel">{u.description}</p>
                      {upsellSummary(u) && <p className="mt-1 text-xs text-steel">{upsellSummary(u)}</p>}
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-steel">
                        <span className="font-mono text-blue">{orderById(u.service_order_id)?.code ?? "—"}</span>
                        <span>·</span>
                        <span>{vehicleLabel(u.service_order_id)}</span>
                        <span>·</span>
                        <span>{technicianName(u.detected_by_user_id)}</span>
                        {u.evidence_count > 0 && (
                          <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                            <Camera className="h-3 w-3" />
                            {u.evidence_count} evidencia{u.evidence_count > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        onClick={() => handleAction(u, "rechazado")}
                        disabled={actingId === u.id || !isOrderEditable(u.service_order_id)}
                        className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        Rechazar
                      </button>
                      <button
                        onClick={() => handleAction(u, "pospuesto")}
                        disabled={actingId === u.id || !isOrderEditable(u.service_order_id)}
                        className="rounded-full border border-navy/15 px-4 py-2 text-sm font-semibold text-navy transition hover:bg-ash disabled:opacity-50"
                      >
                        Posponer
                      </button>
                      <button
                        onClick={() => setApprovingUpsell(u)}
                        disabled={actingId === u.id || !isOrderEditable(u.service_order_id)}
                        className="flex items-center gap-1.5 rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-50"
                      >
                        {actingId === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        Aprobar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-navy/10 bg-white p-6">
            <p className="font-display text-lg font-bold text-navy">Histórico de upsells</p>
            <p className="mt-1 text-sm text-steel">Upsells aprobados, pospuestos y rechazados</p>

            <div className="relative my-4">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por fecha, vehículo, técnico, estado o N.º de ODS..."
                className="w-full rounded-full border border-navy/15 py-3 pl-11 pr-4 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
              />
            </div>

            {filteredResolved.length === 0 ? (
              <EmptyState
                compact
                title={search ? `Sin resultados para "${search}"` : "No hay upsells en el histórico."}
              />
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="border-b border-navy/10">
                  <tr>
                    <th className="py-2 font-mono text-[11px] uppercase tracking-widest text-steel">Fecha</th>
                    <th className="py-2 font-mono text-[11px] uppercase tracking-widest text-steel">Upsell</th>
                    <th className="py-2 font-mono text-[11px] uppercase tracking-widest text-steel">Vehículo</th>
                    <th className="py-2 font-mono text-[11px] uppercase tracking-widest text-steel">Técnico</th>
                    <th className="py-2 text-right font-mono text-[11px] uppercase tracking-widest text-steel">Monto</th>
                    <th className="py-2 font-mono text-[11px] uppercase tracking-widest text-steel">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy/5">
                  {filteredResolved.map((u) => (
                    <tr key={u.id}>
                      <td className="py-3 text-steel">{new Date(u.created_at).toLocaleDateString("es-VE")}</td>
                      <td className="py-3">
                        <p className="font-semibold text-navy">{u.title}</p>
                        <p className="text-xs text-steel">
                          {orderById(u.service_order_id)?.code ?? "—"} · {u.evidence_count} evidencia
                          {u.evidence_count !== 1 ? "s" : ""}
                        </p>
                        {u.status === "aprobado" && (
                          <p className="mt-0.5 text-xs text-emerald-700">
                            Aprobado por {technicianName(u.approved_by_user_id)}
                            {u.approval_channel && ` · ${CHANNEL_LABELS[u.approval_channel]}`}
                            {u.resolved_at && ` · ${new Date(u.resolved_at).toLocaleDateString("es-VE")}`}
                          </p>
                        )}
                      </td>
                      <td className="py-3 text-navy">{vehicleLabel(u.service_order_id)}</td>
                      <td className="py-3 text-steel">{technicianName(u.detected_by_user_id)}</td>
                      <td className="py-3 text-right font-semibold text-navy">{usd(u.amount)}</td>
                      <td className="py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest ${STATUS_STYLES[u.status]}`}
                        >
                          {STATUS_LABELS[u.status]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {filialId && (
        <CreateUpsellModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          filialId={filialId}
          orders={orders.filter((order) => !order.invoiced_at && !["orden_cerrada", "cancelado"].includes(order.status))}
          currentUserId={currentUser?.userId ?? null}
          onSubmit={addUpsell}
        />
      )}

      {approvingUpsell && (
        <ApproveUpsellModal
          upsell={approvingUpsell}
          submitting={actingId === approvingUpsell.id}
          onClose={() => setApprovingUpsell(null)}
          onConfirm={(channel) => handleApprove(approvingUpsell, channel)}
        />
      )}
    </div>
  );
}

function ApproveUpsellModal({
  upsell,
  submitting,
  onClose,
  onConfirm,
}: {
  upsell: Upsell;
  submitting: boolean;
  onClose: () => void;
  onConfirm: (channel: UpsellApprovalChannel) => void;
}) {
  const [channel, setChannel] = useState<UpsellApprovalChannel>("presencial");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-navy/40" />
      <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-navy/10 px-6 py-4">
          <h2 className="font-display text-lg font-bold text-navy">Aprobar upsell</h2>
          <button onClick={onClose} aria-label="Cerrar" className="rounded-lg p-2 text-steel hover:bg-ash hover:text-navy">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4 p-6">
          <p className="text-sm text-steel">
            {upsell.title} · <span className="font-semibold text-navy">{usd(upsell.amount)}</span>
          </p>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">¿Por qué medio aprobó el cliente? *</label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as UpsellApprovalChannel)}
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
            >
              {CHANNEL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => onConfirm(channel)}
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-700 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Confirmar aprobación
          </button>
        </div>
      </div>
    </div>
  );
}

interface TaskDraft {
  tempario_id: string;
  code: string;
  name: string;
  hours: number;
}

interface PartDraft {
  part_id: string;
  code: string;
  name: string;
  quantity: string;
}

function CreateUpsellModal({
  open,
  onClose,
  filialId,
  orders,
  currentUserId,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  filialId: string;
  orders: { id: string; code: string }[];
  currentUserId: string | null;
  onSubmit: (
    orderId: string,
    input: {
      title: string;
      description: string;
      evidence_count?: number;
      detected_by_user_id?: string | null;
      tasks?: { tempario_id: string }[];
      parts?: { part_id: string; quantity: number }[];
    }
  ) => Promise<unknown>;
}) {
  const [orderId, setOrderId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [evidenceCount, setEvidenceCount] = useState("0");
  const [taskSearch, setTaskSearch] = useState("");
  const [partSearch, setPartSearch] = useState("");
  const [selectedTasks, setSelectedTasks] = useState<TaskDraft[]>([]);
  const [selectedParts, setSelectedParts] = useState<PartDraft[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { temparios } = useTemparios(filialId, taskSearch || undefined);
  const { parts } = useParts(filialId, partSearch || undefined);

  const taskResults = temparios.filter((t) => !selectedTasks.some((s) => s.tempario_id === t.id)).slice(0, 6);
  const partResults = parts.filter((p) => !selectedParts.some((s) => s.part_id === p.id)).slice(0, 6);

  function reset() {
    setOrderId("");
    setTitle("");
    setDescription("");
    setEvidenceCount("0");
    setTaskSearch("");
    setPartSearch("");
    setSelectedTasks([]);
    setSelectedParts([]);
    setError(null);
  }

  async function handleSubmit() {
    if (!orderId || !title.trim() || !description.trim()) {
      setError("Selecciona la ODS y completa título y descripción.");
      return;
    }
    if (selectedTasks.length === 0 && selectedParts.length === 0) {
      setError("Agrega al menos una tarea del tempario o un repuesto.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(orderId, {
        title,
        description,
        evidence_count: Number(evidenceCount) || 0,
        detected_by_user_id: currentUserId,
        tasks: selectedTasks.map((t) => ({ tempario_id: t.tempario_id })),
        parts: selectedParts.map((p) => ({ part_id: p.part_id, quantity: Number(p.quantity) || 1 })),
      });
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el upsell.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-navy/40" />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-navy/10 px-6 py-4">
          <h2 className="font-display text-lg font-bold text-navy">Nuevo upsell</h2>
          <button onClick={onClose} aria-label="Cerrar" className="rounded-lg p-2 text-steel hover:bg-ash hover:text-navy">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Orden de Servicio</label>
            <select
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
            >
              <option value="">Selecciona una ODS...</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.code}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Título</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Fuga en amortiguador trasero"
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Amortiguador trasero derecho con fuga de aceite; se recomienda cambio del par."
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Tareas del tempario</label>
            <div className="relative">
              <input
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
                placeholder="Buscar por código o nombre..."
                className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
              />
              {taskSearch && taskResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full divide-y divide-navy/5 rounded-xl border border-navy/10 bg-white shadow-lg">
                  {taskResults.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setSelectedTasks((prev) => [
                          ...prev,
                          { tempario_id: t.id, code: t.code, name: t.name, hours: t.estimated_hours },
                        ]);
                        setTaskSearch("");
                      }}
                      className="block w-full px-4 py-2 text-left text-sm hover:bg-ash"
                    >
                      <span className="font-mono text-blue">{t.code}</span>{" "}
                      <span className="text-navy">{t.name}</span>{" "}
                      <span className="text-steel">({t.estimated_hours}h)</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedTasks.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {selectedTasks.map((t) => (
                  <div key={t.tempario_id} className="flex items-center justify-between rounded-lg bg-ash px-3 py-2 text-sm">
                    <span>
                      <span className="font-mono text-blue">{t.code}</span> {t.name}{" "}
                      <span className="text-steel">({t.hours}h)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedTasks((prev) => prev.filter((x) => x.tempario_id !== t.tempario_id))}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Repuestos</label>
            <div className="relative">
              <input
                value={partSearch}
                onChange={(e) => setPartSearch(e.target.value)}
                placeholder="Buscar por código o nombre..."
                className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
              />
              {partSearch && partResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full divide-y divide-navy/5 rounded-xl border border-navy/10 bg-white shadow-lg">
                  {partResults.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedParts((prev) => [
                          ...prev, { part_id: p.id, code: p.code, name: p.name, quantity: "1" },
                        ]);
                        setPartSearch("");
                      }}
                      className="block w-full px-4 py-2 text-left text-sm hover:bg-ash"
                    >
                      <span className="font-mono text-blue">{p.code}</span> <span className="text-navy">{p.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedParts.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {selectedParts.map((p) => (
                  <div key={p.part_id} className="flex items-center justify-between gap-2 rounded-lg bg-ash px-3 py-2 text-sm">
                    <span className="flex-1">
                      <span className="font-mono text-blue">{p.code}</span> {p.name}
                    </span>
                    <input
                      type="number"
                      min="1"
                      value={p.quantity}
                      onChange={(e) =>
                        setSelectedParts((prev) =>
                          prev.map((x) => (x.part_id === p.part_id ? { ...x, quantity: e.target.value } : x))
                        )
                      }
                      className="w-16 rounded-lg border border-navy/15 px-2 py-1 text-center text-sm outline-none focus:border-blue"
                    />
                    <button
                      type="button"
                      onClick={() => setSelectedParts((prev) => prev.filter((x) => x.part_id !== p.part_id))}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Cantidad de evidencias (fotos)</label>
            <input
              type="number"
              min="0"
              value={evidenceCount}
              onChange={(e) => setEvidenceCount(e.target.value)}
              className="w-24 rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
            />
            <p className="mt-1.5 text-xs text-steel">
              Todavía no hay subida real de fotos — es solo un contador por ahora.
            </p>
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Crear upsell
          </button>
        </div>
      </div>
    </div>
  );
}
