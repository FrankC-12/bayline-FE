"use client";

import { AlertTriangle } from "lucide-react";
import type { ManualMovementsRate } from "@/types/kpis";

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export default function ManualMovementsRateCard({ report }: { report: ManualMovementsRate }) {
  const isHigh = report.rate > 0.2;

  return (
    <div className="p-6">
      <div className="mb-4 flex items-start gap-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Un movimiento manual es un ingreso o egreso registrado a mano en Finanzas, con concepto y contraparte, en
          vez de generado por una venta, factura o reclamo. Un porcentaje alto es la alerta de que alguien está
          esquivando el flujo operativo — cobros y pagos que debieron pasar por Cuentas por Cobrar/Pagar.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className={`rounded-xl p-5 ${isHigh ? "bg-red-50" : "bg-ash"}`}>
          <p className="font-mono text-[11px] uppercase tracking-widest text-steel">% de movimientos manuales</p>
          <p className={`mt-1 font-display text-2xl font-bold ${isHigh ? "text-red-600" : "text-navy"}`}>
            {pct(report.rate)}
          </p>
        </div>
        <div className="rounded-xl bg-ash p-5">
          <p className="font-mono text-[11px] uppercase tracking-widest text-steel">Movimientos manuales</p>
          <p className="mt-1 font-display text-2xl font-bold text-navy">{report.manual_count}</p>
        </div>
        <div className="rounded-xl bg-ash p-5">
          <p className="font-mono text-[11px] uppercase tracking-widest text-steel">Total de movimientos</p>
          <p className="mt-1 font-display text-2xl font-bold text-navy">{report.total_count}</p>
        </div>
      </div>
    </div>
  );
}
