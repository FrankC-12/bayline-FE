"use client";

import { useState } from "react";
import { Plus, Search, X, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSupplierClaims } from "@/hooks/useSupplierClaims";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useParts } from "@/hooks/useParts";
import type { ClaimStatus } from "@/types/administracion";

const STATUS_OPTIONS: { value: ClaimStatus; label: string }[] = [
  { value: "pendiente_envio", label: "Pendiente de envío" },
  { value: "enviado", label: "Enviado al proveedor" },
  { value: "aprobado", label: "Aprobado — reposición en camino" },
  { value: "rechazado", label: "Rechazado" },
  { value: "resuelto", label: "Resuelto" },
];

const STATUS_STYLES: Record<ClaimStatus, string> = {
  pendiente_envio: "bg-slate-100 text-slate-600",
  enviado: "bg-blue-light text-blue",
  aprobado: "bg-emerald-100 text-emerald-700",
  rechazado: "bg-red-100 text-red-700",
  resuelto: "bg-emerald-100 text-emerald-700",
};

function statusLabel(status: ClaimStatus) {
  return STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;
}

export default function SupplierClaimsView() {
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;

  const { claims, loading, addClaim, editClaim } = useSupplierClaims(filialId);
  const { suppliers } = useSuppliers(filialId);
  const { parts } = useParts(filialId);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ClaimStatus | "todos">("todos");
  const [createOpen, setCreateOpen] = useState(false);

  const partName = (id: string) => parts.find((p) => p.id === id)?.name ?? "—";
  const supplierName = (id: string) => suppliers.find((s) => s.id === id)?.business_name ?? "—";

  const filtered = claims.filter((c) => {
    if (statusFilter !== "todos" && c.status !== statusFilter) return false;
    if (search) {
      const term = search.toLowerCase();
      if (!partName(c.part_id).toLowerCase().includes(term) && !supplierName(c.supplier_id).toLowerCase().includes(term)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold text-navy">Reclamos a Proveedor</h1>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy"
        >
          <Plus className="h-4 w-4" />
          Nuevo reclamo
        </button>
      </div>
      <p className="mb-4 text-sm text-steel">Reclamos por repuestos dañados atribuibles al proveedor</p>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por repuesto o proveedor..."
            className="w-full rounded-full border border-navy/15 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ClaimStatus | "todos")}
          className="rounded-full border border-navy/15 bg-white px-4 py-3 text-sm outline-none focus:border-blue"
        >
          <option value="todos">Todos los estados</option>
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
        {loading ? (
          <div className="p-12 text-center text-sm text-steel">Cargando reclamos...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-steel">No hay reclamos que coincidan.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-navy/10 bg-ash">
              <tr>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Fecha</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Repuesto</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Cant.</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Proveedor</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Estado</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Devolución</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {filtered.map((c) => (
                <tr key={c.id} className="transition hover:bg-ash/60">
                  <td className="px-6 py-4 text-steel">{new Date(c.created_at).toLocaleDateString("es-VE")}</td>
                  <td className="px-6 py-4 font-semibold text-navy">{partName(c.part_id)}</td>
                  <td className="px-6 py-4 text-navy">{c.quantity}</td>
                  <td className="px-6 py-4 text-steel">{supplierName(c.supplier_id)}</td>
                  <td className="px-6 py-4">
                    <select
                      value={c.status}
                      onChange={(e) => editClaim(c.id, { status: e.target.value })}
                      className={`rounded-full border-0 px-2.5 py-1 text-xs font-semibold outline-none ${STATUS_STYLES[c.status]}`}
                    >
                      {STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 font-mono text-blue">{c.return_reference ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {filialId && (
        <CreateClaimModal open={createOpen} onClose={() => setCreateOpen(false)} onSubmit={addClaim} />
      )}
    </div>
  );
}

function CreateClaimModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: { part_id: string; quantity: number; supplier_id: string; note?: string | null }) => Promise<unknown>;
}) {
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;
  const { parts } = useParts(filialId);
  const { suppliers } = useSuppliers(filialId);

  const [search, setSearch] = useState("");
  const [partId, setPartId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const results = search && !partId
    ? parts.filter((p) => p.code.toLowerCase().includes(search.toLowerCase()) || p.name.toLowerCase().includes(search.toLowerCase())).slice(0, 6)
    : [];

  async function handleSubmit() {
    if (!partId || Number(quantity) <= 0 || !supplierId) {
      setError("Completa el repuesto, la cantidad y el proveedor.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ part_id: partId, quantity: Number(quantity), supplier_id: supplierId, note: note || null });
      setSearch("");
      setPartId("");
      setQuantity("");
      setSupplierId("");
      setNote("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el reclamo.");
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
          <h2 className="font-display text-lg font-bold text-navy">Nuevo reclamo a proveedor</h2>
          <button onClick={onClose} aria-label="Cerrar" className="rounded-lg p-2 text-steel hover:bg-ash hover:text-navy">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Repuesto</label>
            <div className="relative">
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPartId("");
                }}
                placeholder="Buscar por código o nombre..."
                className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
              />
              {results.length > 0 && (
                <div className="absolute z-10 mt-1 w-full divide-y divide-navy/5 rounded-xl border border-navy/10 bg-white shadow-lg">
                  {results.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setPartId(p.id);
                        setSearch(`${p.code} · ${p.name}`);
                      }}
                      className="block w-full px-4 py-2 text-left text-sm hover:bg-ash"
                    >
                      <span className="font-mono text-blue">{p.code}</span> {p.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Cantidad</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Proveedor</label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
            >
              <option value="">Selecciona un proveedor...</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.business_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Nota (opcional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
            />
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Crear reclamo
          </button>
        </div>
      </div>
    </div>
  );
}