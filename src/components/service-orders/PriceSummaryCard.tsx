"use client";

import { formatMoney , formatCount} from "@/lib/format";
import { useState } from "react";
import type { OrderSummary } from "@/types/serviceOrder";

import { DISCOUNT_OPTIONS, PARTS_MULTIPLIERS, type DiscountLabel } from "@/lib/partsPricing";

interface PriceSummaryCardProps {
  summary: OrderSummary;
  totalAmount?: number | null;
  onDiscountChange: (value: DiscountLabel) => Promise<void>;
  saving?: boolean;
  readOnly?: boolean;
}

export default function PriceSummaryCard({ summary, totalAmount, onDiscountChange, saving, readOnly = false }: PriceSummaryCardProps) {
  const [error, setError] = useState<string | null>(null);

  async function changeDiscount(value: DiscountLabel) {
    if (readOnly) return;
    setError(null);
    try {
      await onDiscountChange(value);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el descuento.");
    }
  }

  const parts=summary.parts_subtotal;
  const multiplier=PARTS_MULTIPLIERS[summary.discount_label];
  const discount=parts != null && multiplier ? Math.max(0,parts / multiplier * 1.3 - parts) : null;
  const subtotal=parts != null && summary.labor_subtotal != null ? parts+summary.labor_subtotal : null;
  const amount=(value:number|null)=>value == null ? "—" : `$${formatMoney(value,2)}`;
  return (
    <section aria-label="Total del cliente" className="rounded-2xl border border-navy/10 bg-white p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h3 className="font-display text-sm font-bold text-navy">Total del cliente</h3><label className="flex flex-wrap items-center gap-2 text-xs text-steel">Precio de repuestos<select aria-label="Precio de repuestos" value={summary.discount_label} onChange={e=>void changeDiscount(e.target.value as DiscountLabel)} disabled={saving || readOnly} className="max-w-full rounded-lg border border-navy/15 bg-white px-2 py-1.5 text-xs text-navy">{DISCOUNT_OPTIONS.map(o=><option key={o} value={o}>{o}</option>)}</select></label></div>
      {error && <p role="alert" className="mb-3 text-sm text-red-600">{error}</p>}
      <dl className="grid grid-cols-2 overflow-hidden rounded-xl border border-navy/5 sm:grid-cols-3 xl:grid-cols-6">{[
        {label:"Repuestos",value:amount(parts != null && discount != null ? parts+discount : parts)},
        {label:"Descuento",value:amount(discount)},
        {label:"Mano de obra",value:amount(summary.labor_subtotal)},
        {label:"Subtotal",value:amount(subtotal)},
        {label:`IVA ${summary.iva_percentage == null ? "" : formatCount(summary.iva_percentage)+" %"}`,value:amount(summary.iva_amount)},
        {label:"A pagar",value:amount(summary.total)},
      ].map((item,index)=><div key={item.label} className={`min-w-0 p-3 ${index === 5 ? "bg-blue-light/70" : "border-r border-navy/5"}`}><dt className="font-mono text-[9px] uppercase tracking-wider text-steel">{item.label}</dt><dd className={`mt-1 break-words font-display font-bold ${index === 5 ? "text-lg text-blue" : "text-sm text-navy"}`}>{item.value}</dd></div>)}</dl>
      {summary.igtf_amount > 0 && <p className="mt-3 text-xs text-steel">Incluye IGTF ({formatCount(summary.igtf_percentage)}%): ${formatMoney(summary.igtf_amount,2)}</p>}
      {summary.non_client_subtotal > 0 && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Cubierto por garantía/plan/proveedor (no se cobra al cliente): $
          {formatMoney(summary.non_client_subtotal, 2)}
        </p>
      )}

      {!summary.pricing_snapshot_available && (
        <p className="mt-3 text-xs text-steel">El desglose histórico no está disponible. Se conserva el total facturado.</p>
      )}
      {totalAmount != null && (
        <p className="mt-3 rounded-lg bg-white/60 px-3 py-2 text-xs text-steel">
          Facturado por <span className="font-semibold text-navy">${formatMoney(totalAmount, 2)}</span>.
        </p>
      )}
    </section>
  );
}