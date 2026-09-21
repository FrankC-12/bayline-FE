"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getHoldingWarrantyReceivables, type HoldingWarrantyReceivablesReport } from "@/lib/api/holding";
import EmptyState from "@/components/common/EmptyState";

const usd = (value: number) => `$${value.toLocaleString("es-VE", { minimumFractionDigits: 2 })}`;

export default function GarantiasConsolidadoView() {
  const { currentUser } = useAuth();
  const holdingId = currentUser?.holdingId ?? null;
  const [report, setReport] = useState<HoldingWarrantyReceivablesReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!holdingId) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    getHoldingWarrantyReceivables(holdingId)
      .then((data) => { if (active) setReport(data); })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : "No se pudo cargar el reporte."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [holdingId]);

  return (
    <div className="max-w-5xl">
      <h1 className="mb-2 font-display text-3xl font-bold text-navy">Garantías al Holding — Consolidado</h1>
      <p className="mb-6 text-sm text-steel">
        Cuánto se le ha facturado al holding por garantías de fábrica en cada filial, cuánto sigue pendiente de cobro y cuánto ya se cobró con sus retenciones.
      </p>

      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
        {loading ? (
          <div className="p-12 text-center text-sm text-steel">Cargando reporte...</div>
        ) : !report || report.filiales.length === 0 ? (
          <EmptyState compact title="No hay facturas de garantía registradas todavía." />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-navy/10 bg-ash">
              <tr>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Filial</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Facturado</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Pendiente</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Cobrado (neto)</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Retenido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {report.filiales.map((row) => (
                <tr key={row.filial_id} className="transition hover:bg-ash/60">
                  <td className="px-6 py-4 font-semibold text-navy">{row.filial_name}</td>
                  <td className="px-6 py-4 text-navy">{usd(row.total_invoiced)}</td>
                  <td className="px-6 py-4 font-semibold text-amber-700">{usd(row.total_pending)}</td>
                  <td className="px-6 py-4 text-emerald-700">{usd(row.total_collected)}</td>
                  <td className="px-6 py-4 text-steel">{usd(row.total_withheld)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
