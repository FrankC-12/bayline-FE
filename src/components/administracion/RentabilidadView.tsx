"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getProfitability } from "@/lib/api/administracion";
import type { ProfitabilityReport } from "@/types/administracion";

function monthBounds(monthValue: string): { from: string; to: string } {
  const [year, month] = monthValue.split("-").map(Number);
  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 0);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { from: fmt(from), to: fmt(to) };
}

export default function RentabilidadView() {
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;

  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [report, setReport] = useState<ProfitabilityReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!filialId) return;
    setLoading(true);
    const { from, to } = monthBounds(month);
    getProfitability(filialId, from, to).then((data) => {
      setReport(data);
      setLoading(false);
    });
  }, [filialId, month]);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-navy">Rentabilidad</h1>
      <p className="mt-1 text-sm text-steel">Utilidad bruta y neta del negocio según el período seleccionado</p>

      <div className="mt-6 flex items-center gap-4 rounded-2xl border border-navy/10 bg-white p-4">
        <span className="font-mono text-[11px] uppercase tracking-widest text-steel">Período</span>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-xl border border-navy/15 px-4 py-2 text-sm outline-none focus:border-blue"
        />
      </div>

      {loading || !report ? (
        <div className="mt-6 p-12 text-center text-sm text-steel">Calculando rentabilidad...</div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-navy/10 bg-white p-6">
              <p className="font-mono text-[11px] uppercase tracking-widest text-steel">Utilidad bruta</p>
              <p className="mt-1 font-display text-3xl font-bold text-navy">${report.gross_profit.toFixed(2)}</p>
              <p className="mt-1 text-xs text-steel">
                Margen bruto {report.total_income ? ((report.gross_profit / report.total_income) * 100).toFixed(1) : "0.0"}% sobre ingresos
              </p>
            </div>
            <div className={`rounded-2xl border p-6 ${report.net_profit >= 0 ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}>
              <p className="font-mono text-[11px] uppercase tracking-widest text-steel">Utilidad neta</p>
              <p className={`mt-1 font-display text-3xl font-bold ${report.net_profit >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                {report.net_profit >= 0 ? "↑ +" : "↓ -"}${Math.abs(report.net_profit).toFixed(2)}
              </p>
              <p className="mt-1 text-xs text-steel">
                Margen neto {report.total_income ? ((report.net_profit / report.total_income) * 100).toFixed(1) : "0.0"}% sobre ingresos
              </p>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-navy/10 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-navy/10 bg-ash">
                <tr>
                  <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Concepto</th>
                  <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Origen del dato</th>
                  <th className="px-6 py-3 text-right font-mono text-[11px] uppercase tracking-widest text-steel">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/5">
                <tr>
                  <td className="px-6 py-4 font-semibold text-navy">Ingresos totales</td>
                  <td className="px-6 py-4 text-steel">Ingresos automáticos y manuales del período</td>
                  <td className="px-6 py-4 text-right font-semibold text-navy">${report.total_income.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-navy">Costo de repuestos vendidos</td>
                  <td className="px-6 py-4 text-steel">Costo promedio (Almacén) de los repuestos vendidos</td>
                  <td className="px-6 py-4 text-right text-red-600">- ${report.parts_cost.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-navy">Costo de vehículos vendidos</td>
                  <td className="px-6 py-4 text-steel">Costo de adquisición de los vehículos vendidos</td>
                  <td className="px-6 py-4 text-right text-red-600">- ${report.vehicles_cost.toFixed(2)}</td>
                </tr>
                <tr className="bg-ash/50">
                  <td className="px-6 py-4 font-bold text-navy">Utilidad bruta</td>
                  <td className="px-6 py-4 text-steel">Ingresos totales − costos directos</td>
                  <td className="px-6 py-4 text-right font-bold text-emerald-700">${report.gross_profit.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-navy">Gastos operacionales</td>
                  <td className="px-6 py-4 text-steel">Egresos del período, sin compras a proveedores ni comisiones</td>
                  <td className="px-6 py-4 text-right text-red-600">- ${report.operating_expenses.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-navy">Comisiones pagadas</td>
                  <td className="px-6 py-4 text-steel">Categoría &quot;Nómina y Comisiones&quot; en Egresos</td>
                  <td className="px-6 py-4 text-right text-red-600">- ${report.commissions_paid.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-navy">Pérdidas por mermas</td>
                  <td className="px-6 py-4 text-steel">Devoluciones a proveedor registradas en Almacén</td>
                  <td className="px-6 py-4 text-right text-red-600">- ${report.shrinkage_losses.toFixed(2)}</td>
                </tr>
                <tr className="bg-ash/50">
                  <td className="px-6 py-4 font-bold text-navy">Utilidad neta</td>
                  <td className="px-6 py-4 text-steel">Utilidad bruta − gastos, comisiones y mermas</td>
                  <td className={`px-6 py-4 text-right font-bold ${report.net_profit >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                    ${report.net_profit.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-4 rounded-xl bg-ash px-4 py-3 text-xs text-steel">
            El costo de repuestos usa el costo real al momento de cada venta (o el promedio actual de
            Almacén para ventas anteriores a esta mejora). El costo de vehículos requiere que le hayas
            cargado un &quot;Costo de adquisición&quot; en Concesionario.
          </p>
        </>
      )}
    </div>
  );
}