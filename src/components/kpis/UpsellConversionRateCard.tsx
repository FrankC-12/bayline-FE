"use client";

import { TrendingUp } from "lucide-react";
import type { UpsellConversionRate } from "@/types/kpis";

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export default function UpsellConversionRateCard({ report }: { report: UpsellConversionRate }) {
  const isLow = report.postponed_count > 0 && report.rate < 0.3;

  return (
    <div className="p-6">
      <div className="mb-4 flex items-start gap-3 rounded-xl bg-blue-light px-4 py-3 text-sm text-blue">
        <TrendingUp className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          De las recomendaciones (upsells) que un técnico pospuso en este período, qué porcentaje terminó
          convirtiéndose en una tarea real de alguna ODS — misma visita o una posterior. Una tasa baja sugiere que
          las recomendaciones pospuestas se están perdiendo en vez de resolverse en el reingreso.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className={`rounded-xl p-5 ${isLow ? "bg-red-50" : "bg-ash"}`}>
          <p className="font-mono text-[11px] uppercase tracking-widest text-steel">Tasa de conversión</p>
          <p className={`mt-1 font-display text-2xl font-bold ${isLow ? "text-red-600" : "text-navy"}`}>
            {pct(report.rate)}
          </p>
        </div>
        <div className="rounded-xl bg-ash p-5">
          <p className="font-mono text-[11px] uppercase tracking-widest text-steel">Convertidos a ODS</p>
          <p className="mt-1 font-display text-2xl font-bold text-navy">{report.converted_count}</p>
        </div>
        <div className="rounded-xl bg-ash p-5">
          <p className="font-mono text-[11px] uppercase tracking-widest text-steel">Upsells pospuestos</p>
          <p className="mt-1 font-display text-2xl font-bold text-navy">{report.postponed_count}</p>
        </div>
      </div>
    </div>
  );
}
