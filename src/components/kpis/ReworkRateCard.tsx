"use client";

import { AlertTriangle } from "lucide-react";
import type { ReworkReport } from "@/types/kpis";

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function days(value: number | null): string {
  if (value == null) return "—";
  return `${value.toFixed(1)} días`;
}

export default function ReworkRateCard({
  report,
  userName,
}: {
  report: ReworkReport;
  userName: (id: string) => string;
}) {
  return (
    <div className="p-6">
      <div className="mb-4 flex items-start gap-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          La calidad de este número depende de que la causa de la falla la registre quien hizo el trabajo. Si el
          taller no tiene una aplicación para que el técnico la registre, hoy la anota el asesor — que no hizo el
          trabajo — y el dato es una aproximación.
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-ash p-5">
          <p className="font-mono text-[11px] uppercase tracking-widest text-steel">Tasa de retrabajo</p>
          <p className="mt-1 font-display text-2xl font-bold text-navy">{pct(report.rework_rate)}</p>
          <p className="mt-1 text-xs text-steel">
            {report.orders_with_claim_count} de {report.invoiced_orders_count} órdenes facturadas
          </p>
        </div>
        <div className="rounded-xl bg-ash p-5">
          <p className="font-mono text-[11px] uppercase tracking-widest text-steel">Tiempo promedio a reclamo</p>
          <p className="mt-1 font-display text-2xl font-bold text-navy">{days(report.avg_days_to_claim)}</p>
        </div>
        <div className="rounded-xl bg-ash p-5">
          <p className="font-mono text-[11px] uppercase tracking-widest text-steel">Reclamos rápidos (≤30 días)</p>
          <p className="mt-1 font-display text-2xl font-bold text-navy">{report.quick_claims_count}</p>
          <p className="mt-1 text-xs text-steel">Probable problema de mano de obra</p>
        </div>
        <div className="rounded-xl bg-ash p-5">
          <p className="font-mono text-[11px] uppercase tracking-widest text-steel">Reclamos tardíos (&gt;30 días)</p>
          <p className="mt-1 font-display text-2xl font-bold text-navy">{report.slow_claims_count}</p>
          <p className="mt-1 text-xs text-steel">Probable desgaste normal</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <BreakdownTable
          title="Por técnico"
          empty="Sin datos para este rango."
          rows={report.by_technician.map((r) => ({
            key: r.user_id,
            label: userName(r.user_id),
            count: r.claims_count,
            extra: `${pct(r.rework_rate)} de ${r.invoiced_orders_count} órdenes`,
            days: r.avg_days_to_claim,
          }))}
        />
        <BreakdownTable
          title="Por servicio"
          empty="Ningún reclamo señaló un servicio específico."
          rows={report.by_service.map((r) => ({
            key: r.tempario_id,
            label: r.tempario_name,
            count: r.claims_count,
            days: r.avg_days_to_claim,
          }))}
        />
        <BreakdownTable
          title="Por repuesto"
          empty="Ningún reclamo señaló un repuesto específico."
          rows={report.by_part.map((r) => ({
            key: r.part_id,
            label: r.part_name,
            count: r.claims_count,
            days: r.avg_days_to_claim,
          }))}
        />
      </div>
    </div>
  );
}

function BreakdownTable({
  title,
  empty,
  rows,
}: {
  title: string;
  empty: string;
  rows: { key: string; label: string; count: number; extra?: string; days: number | null }[];
}) {
  return (
    <div>
      <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-blue">{title}</p>
      {rows.length === 0 ? (
        <p className="text-sm text-steel">{empty}</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="border-b border-navy/10">
            <tr className="text-steel">
              <th className="pb-2 font-mono text-[10px] uppercase tracking-widest">Nombre</th>
              <th className="pb-2 text-right font-mono text-[10px] uppercase tracking-widest">Reclamos</th>
              <th className="pb-2 text-right font-mono text-[10px] uppercase tracking-widest">Prom. días</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {rows.map((row) => (
              <tr key={row.key}>
                <td className="py-2.5">
                  <span className="font-medium text-navy">{row.label}</span>
                  {row.extra && <span className="block text-xs text-steel">{row.extra}</span>}
                </td>
                <td className="py-2.5 text-right text-navy">{row.count}</td>
                <td className="py-2.5 text-right text-navy">{row.days != null ? row.days.toFixed(1) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
