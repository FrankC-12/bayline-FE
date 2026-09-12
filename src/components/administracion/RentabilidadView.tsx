"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Lock, Unlock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useFiliales } from "@/hooks/useFiliales";
import { getProfitability } from "@/lib/api/administracion";
import { getHoldingProfitability } from "@/lib/api/holding";
import type { ProfitabilityReport } from "@/types/administracion";

function monthBounds(monthValue: string): { from: string; to: string } {
  const [year, month] = monthValue.split("-").map(Number);
  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 0);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { from: fmt(from), to: fmt(to) };
}

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

const ALL_FILIALES = "__todas__";

export default function RentabilidadView() {
  const { currentUser } = useAuth();
  const isHoldingUser = currentUser?.scope === "holding";
  const holdingId = currentUser?.holdingId ?? null;
  const filialId = currentUser?.filialId ?? null;
  const { filiales } = useFiliales(isHoldingUser ? holdingId : null);

  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedFilial, setSelectedFilial] = useState<string>(isHoldingUser ? ALL_FILIALES : (filialId ?? ""));
  const [currencyDisplay, setCurrencyDisplay] = useState<"usd" | "bs">("usd");
  const [report, setReport] = useState<ProfitabilityReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { from, to } = monthBounds(month);
    setLoading(true);
    const fetcher =
      selectedFilial === ALL_FILIALES && holdingId
        ? getHoldingProfitability(holdingId, from, to)
        : selectedFilial
          ? getProfitability(selectedFilial, from, to)
          : null;
    if (!fetcher) {
      setLoading(false);
      return;
    }
    fetcher.then((data) => {
      setReport(data);
      setLoading(false);
    });
  }, [month, selectedFilial, holdingId]);

  const fmt = (usd: number) => {
    const value = currencyDisplay === "bs" ? usd * (report?.bcv_rate ?? 0) : usd;
    const prefix = currencyDisplay === "bs" ? "Bs. " : "$";
    return `${prefix}${value.toLocaleString("es-VE", { maximumFractionDigits: 0 })}`;
  };

  const warningText = useMemo(() => {
    if (!report || report.vehicles_sold_count === 0) return null;
    return `${report.vehicles_with_estimated_cost_count} de ${report.vehicles_sold_count} vehículos vendidos tienen costo estimado, no derivado de compra. ${pct(report.manual_movements_rate)} de los movimientos del período son manuales.`;
  }, [report]);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-navy">Rentabilidad</h1>
      <p className="mt-1 text-sm text-steel">Estado de resultados por departamento</p>

      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-navy/10 bg-white p-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-widest text-steel">Período</span>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-xl border border-navy/15 px-3 py-2 text-sm outline-none focus:border-blue"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-widest text-steel">Sucursal</span>
          {isHoldingUser ? (
            <select
              value={selectedFilial}
              onChange={(e) => setSelectedFilial(e.target.value)}
              className="rounded-xl border border-navy/15 px-3 py-2 text-sm outline-none focus:border-blue"
            >
              <option value={ALL_FILIALES}>Todas</option>
              {filiales.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-sm font-medium text-navy">
              {filiales.find((f) => f.id === filialId)?.name ?? "Mi sucursal"}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-widest text-steel">Moneda</span>
          <select
            value={currencyDisplay}
            onChange={(e) => setCurrencyDisplay(e.target.value as "usd" | "bs")}
            className="rounded-xl border border-navy/15 px-3 py-2 text-sm outline-none focus:border-blue"
          >
            <option value="usd">USD</option>
            <option value="bs">Bs</option>
          </select>
        </div>

        {report && (
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-ash px-3 py-1.5 text-xs font-medium text-steel">
            {report.period_is_closed ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
            {report.period_is_closed ? "Período cerrado" : "Período en curso"} · tasa {report.bcv_rate.toLocaleString("es-VE")}
          </span>
        )}
      </div>

      {loading || !report ? (
        <div className="mt-6 p-12 text-center text-sm text-steel">Calculando rentabilidad...</div>
      ) : (
        <>
          {warningText && (
            <div className="mt-6 flex items-start gap-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{warningText}</p>
            </div>
          )}

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-navy/10 bg-white p-6">
              <p className="font-mono text-[11px] uppercase tracking-widest text-steel">Ventas netas</p>
              <p className="mt-1 font-display text-3xl font-bold text-navy">{fmt(report.net_sales_total)}</p>
            </div>
            <div className="rounded-2xl border border-navy/10 bg-white p-6">
              <p className="font-mono text-[11px] uppercase tracking-widest text-steel">Utilidad bruta</p>
              <p className="mt-1 font-display text-3xl font-bold text-navy">{fmt(report.gross_profit_total)}</p>
              <p className="mt-1 text-xs text-steel">Margen {pct(report.gross_margin)}</p>
            </div>
            <div className={`rounded-2xl border p-6 ${report.net_profit >= 0 ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}>
              <p className="font-mono text-[11px] uppercase tracking-widest text-steel">Utilidad neta</p>
              <p className={`mt-1 font-display text-3xl font-bold ${report.net_profit >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                {fmt(report.net_profit)}
              </p>
              <p className="mt-1 text-xs text-steel">Margen {pct(report.net_margin)}</p>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-navy/10 bg-white">
            <p className="border-b border-navy/10 px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-blue">
              Departamento
            </p>
            <table className="w-full text-left text-sm">
              <thead className="border-b border-navy/10 bg-ash">
                <tr>
                  <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Departamento</th>
                  <th className="px-6 py-3 text-right font-mono text-[11px] uppercase tracking-widest text-steel">Ventas netas</th>
                  <th className="px-6 py-3 text-right font-mono text-[11px] uppercase tracking-widest text-steel">Costo directo</th>
                  <th className="px-6 py-3 text-right font-mono text-[11px] uppercase tracking-widest text-steel">Ut. bruta</th>
                  <th className="px-6 py-3 text-right font-mono text-[11px] uppercase tracking-widest text-steel">Margen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/5">
                {report.departments.map((d) => (
                  <tr key={d.key}>
                    <td className="px-6 py-4 text-navy">{d.label}</td>
                    <td className="px-6 py-4 text-right text-navy">{fmt(d.net_sales)}</td>
                    <td className="px-6 py-4 text-right text-steel">{fmt(d.direct_cost)}</td>
                    <td className="px-6 py-4 text-right font-semibold text-navy">{fmt(d.gross_profit)}</td>
                    <td className="px-6 py-4 text-right text-steel">{pct(d.margin)}</td>
                  </tr>
                ))}
                <tr className="bg-ash/50">
                  <td className="px-6 py-4 font-bold text-navy">Utilidad bruta</td>
                  <td className="px-6 py-4 text-right font-bold text-navy">{fmt(report.net_sales_total)}</td>
                  <td className="px-6 py-4 text-right font-bold text-steel">{fmt(report.direct_cost_total)}</td>
                  <td className="px-6 py-4 text-right font-bold text-emerald-700">{fmt(report.gross_profit_total)}</td>
                  <td className="px-6 py-4 text-right font-bold text-steel">{pct(report.gross_margin)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-navy/10 bg-white">
            <p className="border-b border-navy/10 px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-blue">
              Gastos y ajustes
            </p>
            <table className="w-full text-left text-sm">
              <thead className="border-b border-navy/10 bg-ash">
                <tr>
                  <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Ajuste</th>
                  <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Origen</th>
                  <th className="px-6 py-3 text-right font-mono text-[11px] uppercase tracking-widest text-steel">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/5">
                {report.adjustments.map((a) => (
                  <tr key={a.key}>
                    <td className="px-6 py-4 text-navy">{a.label}</td>
                    <td className="px-6 py-4 text-steel">{a.origin}</td>
                    <td className={`px-6 py-4 text-right font-medium ${a.amount < 0 ? "text-red-600" : "text-emerald-700"}`}>
                      {a.amount < 0 ? "−" : "+"}
                      {fmt(Math.abs(a.amount))}
                    </td>
                  </tr>
                ))}
                <tr className="bg-ash/50">
                  <td className="px-6 py-4 font-bold text-navy">Utilidad neta</td>
                  <td className="px-6 py-4 text-steel">Margen neto {pct(report.net_margin)}</td>
                  <td className={`px-6 py-4 text-right font-bold ${report.net_profit >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                    {fmt(report.net_profit)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-4 rounded-xl bg-ash px-4 py-3 text-xs text-steel">
            Los ingresos provienen de documentos fiscales emitidos (venta de vehículo, cierre de venta de
            repuestos, factura de ODS), no de cobros recibidos. El costo de inventario se valora por FIFO al
            momento de cada venta. La diferencia en cambio solo incluye movimientos manuales con tasa
            congelada — un pago en bolívares recibido automáticamente en una ODS no tiene una tasa propia
            registrada y no se re-expresa.
          </p>
        </>
      )}
    </div>
  );
}
