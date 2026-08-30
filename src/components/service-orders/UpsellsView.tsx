"use client";

import { useMemo, useState } from "react";
import { Clock, Camera, Check, X, Loader2, Search, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUpsells } from "@/hooks/useUpsells";
import { useServiceOrders } from "@/hooks/useServiceOrders";
import { useVehicleLookup } from "@/hooks/useVehicleLookUp";
import { useUsers } from "@/hooks/useUser";
import type { Upsell } from "@/types/upsells";

const STATUS_LABELS: Record<string, string> = {
  pospuesto: "Pospuesto",
  rechazado: "Rechazado",
};

const STATUS_STYLES: Record<string, string> = {
  pospuesto: "bg-amber-100 text-amber-700",
  rechazado: "bg-red-100 text-red-700",
};

export default function UpsellsView() {
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;

  const { upsells, loading, addUpsell, setStatus } = useUpsells(filialId);
  const { orders } = useServiceOrders(filialId, "all");
  const { vehicleMap } = useVehicleLookup(filialId);
  const { users } = useUsers({ filialId });
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  const orderById = (id: string) => orders.find((o) => o.id === id);
  const vehicleLabel = (orderId: string) => {
    const order = orderById(orderId);
    if (!order) return "—";
    const entry = vehicleMap.get(order.vehicle_id);
    return entry ? `${entry.vehicle.brand} ${entry.vehicle.model} ${entry.vehicle.year}` : "—";
  };
  const technicianName = (id: string | null) => (id ? users.find((u) => u.id === id)?.full_name ?? "—" : "—");

  const pending = upsells.filter((u) => u.status === "pendiente");
  const resolved = upsells.filter((u) => u.status === "pospuesto" || u.status === "rechazado");

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

  async function handleAction(upsell: Upsell, status: string) {
    setActingId(upsell.id);
    try {
      await setStatus(upsell.id, status);
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
                      <p className="font-display text-lg font-bold text-navy">{u.title}</p>
                      <p className="mt-1 text-sm text-steel">{u.description}</p>
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
                        disabled={actingId === u.id}
                        className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        Rechazar
                      </button>
                      <button
                        onClick={() => handleAction(u, "pospuesto")}
                        disabled={actingId === u.id}
                        className="rounded-full border border-navy/15 px-4 py-2 text-sm font-semibold text-navy transition hover:bg-ash disabled:opacity-50"
                      >
                        Posponer
                      </button>
                      <button
                        onClick={() => handleAction(u, "aprobado")}
                        disabled={actingId === u.id}
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
            <p className="font-display text-lg font-bold text-navy">Upsells no aprobados</p>
            <p className="mt-1 text-sm text-steel">Histórico de upsells pospuestos y rechazados por el cliente</p>

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
              <div className="p-8 text-center text-sm text-steel">No hay upsells en el histórico.</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="border-b border-navy/10">
                  <tr>
                    <th className="py-2 font-mono text-[11px] uppercase tracking-widest text-steel">Fecha</th>
                    <th className="py-2 font-mono text-[11px] uppercase tracking-widest text-steel">Upsell</th>
                    <th className="py-2 font-mono text-[11px] uppercase tracking-widest text-steel">Vehículo</th>
                    <th className="py-2 font-mono text-[11px] uppercase tracking-widest text-steel">Técnico</th>
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
                      </td>
                      <td className="py-3 text-navy">{vehicleLabel(u.service_order_id)}</td>
                      <td className="py-3 text-steel">{technicianName(u.detected_by_user_id)}</td>
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
          orders={orders}
          currentUserId={currentUser?.userId ?? null}
          onSubmit={addUpsell}
        />
      )}
    </div>
  );
}

function CreateUpsellModal({
  open,
  onClose,
  orders,
  currentUserId,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  orders: { id: string; code: string }[];
  currentUserId: string | null;
  onSubmit: (orderId: string, input: { title: string; description: string; evidence_count?: number; detected_by_user_id?: string | null }) => Promise<unknown>;
}) {
  const [orderId, setOrderId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [evidenceCount, setEvidenceCount] = useState("0");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!orderId || !title.trim() || !description.trim()) {
      setError("Selecciona la ODS y completa título y descripción.");
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
      });
      setOrderId("");
      setTitle("");
      setDescription("");
      setEvidenceCount("0");
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
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl">
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