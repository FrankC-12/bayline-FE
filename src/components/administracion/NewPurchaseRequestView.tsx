"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Plus, Search, X, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useParts } from "@/hooks/useParts";
import { usePurchaseRequests } from "@/hooks/usePurchaseRequests";

interface LineDraft {
  partId: string;
  search: string;
  quantity: string;
}

function emptyLine(): LineDraft {
  return { partId: "", search: "", quantity: "0" };
}

export default function NewPurchaseRequestView() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;

  const { suppliers } = useSuppliers(filialId);
  const { parts } = useParts(filialId);
  const { addRequest } = usePurchaseRequests(filialId);

  const [supplierId, setSupplierId] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([emptyLine()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateLine(index: number, patch: Partial<LineDraft>) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  function resultsFor(term: string) {
    if (!term) return [];
    const t = term.toLowerCase();
    return parts.filter((p) => p.code.toLowerCase().includes(t) || p.name.toLowerCase().includes(t)).slice(0, 6);
  }

  async function handleSubmit() {
    const validLines = lines.filter((l) => l.partId && Number(l.quantity) > 0);
    if (!supplierId || validLines.length === 0) {
      setError("Selecciona un proveedor y al menos un repuesto con cantidad.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const created = await addRequest(
        supplierId,
        validLines.map((l) => ({ part_id: l.partId, quantity: Number(l.quantity) }))
      );
      if (created) router.push("/dashboard/administracion");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la solicitud.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!filialId) return null;

  return (
    <div>
      <Link
        href="/dashboard/administracion"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-steel hover:text-navy"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver al historial de compras
      </Link>

      <p className="font-display text-sm font-bold uppercase tracking-wide text-blue">Nueva solicitud</p>
      <h1 className="mb-6 font-display text-3xl font-bold text-navy">Selecciona un proveedor</h1>

      <div className="max-w-2xl space-y-5">
        <div className="rounded-2xl border border-navy/10 bg-white p-6">
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

        <div className="rounded-2xl border border-navy/10 bg-white p-6">
          <p className="mb-3 font-display text-sm font-bold text-navy">Líneas de repuesto</p>
          <div className="space-y-3">
            {lines.map((line, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-steel" />
                  <input
                    value={line.search}
                    onChange={(e) => updateLine(i, { search: e.target.value, partId: "" })}
                    placeholder="Buscar por código o nombre..."
                    className="w-full rounded-xl border border-navy/15 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-blue"
                  />
                  {line.search && !line.partId && resultsFor(line.search).length > 0 && (
                    <div className="absolute z-10 mt-1 w-full divide-y divide-navy/5 rounded-xl border border-navy/10 bg-white shadow-lg">
                      {resultsFor(line.search).map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => updateLine(i, { partId: p.id, search: `${p.code} · ${p.name}` })}
                          className="block w-full px-4 py-2 text-left text-sm hover:bg-ash"
                        >
                          <span className="font-mono text-blue">{p.code}</span> {p.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  type="number"
                  min="0"
                  value={line.quantity}
                  onChange={(e) => updateLine(i, { quantity: e.target.value })}
                  className="w-24 rounded-xl border border-navy/15 px-3 py-2.5 text-center text-sm outline-none focus:border-blue"
                />
                <button
                  type="button"
                  onClick={() => setLines((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev))}
                  className="rounded-xl border border-navy/15 p-2.5 text-red-500 transition hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setLines((prev) => [...prev, emptyLine()])}
            className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-blue hover:text-navy"
          >
            <Plus className="h-4 w-4" />
            Agregar línea
          </button>
        </div>

        <p className="rounded-xl bg-ash px-4 py-3 text-xs text-steel">
          La descarga de TXT/Excel para enviar al proveedor todavía no está disponible.
        </p>

        {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="flex items-center justify-center gap-2 rounded-full bg-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-50"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Crear solicitud
        </button>
      </div>
    </div>
  );
}