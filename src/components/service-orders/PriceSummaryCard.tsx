"use client";

import { useState } from "react";
import type { OrderSummary } from "@/types/serviceOrder";

const DISCOUNT_OPTIONS = [
  "Costo + 30% (Sin Descuento)",
  "Costo + 20% (Descuento 10%)",
  "Costo + 10% (Descuento 20%)",
  "Precio de costo",
];

interface PriceSummaryCardProps {
  summary: OrderSummary;
  totalAmount?: number | null;
}

export default function PriceSummaryCard({ summary, totalAmount }: PriceSummaryCardProps) {
  const [discountLabel, setDiscountLabel] = useState(DISCOUNT_OPTIONS[0]);

  return (
    <div className="rounded-2xl border border-blue/20 bg-blue-light/40 p-6">
      <h3 className="mb-4 font-display text-lg font-bold text-navy">Resumen de precio</h3>

      <div className="mb-4">
        <label className="mb-1.5 block text-xs font-medium text-steel">Descuento en repuestos</label>
        <select
          value={discountLabel}
          onChange={(e) => setDiscountLabel(e.target.value)}
          className="w-full rounded-xl border border-navy/15 bg-white px-4 py-2 text-sm outline-none focus:border-blue"
        >
          {DISCOUNT_OPTIONS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between text-steel">
          <span>Repuestos (ODT)</span>
          <span>${summary.parts_subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-steel">
          <span>Mano de obra (Tareas)</span>
          <span>${summary.labor_subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between border-b border-navy/10 pb-1.5 text-steel">
          <span>IVA ({summary.iva_percentage}%)</span>
          <span>${summary.iva_amount.toFixed(2)}</span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="font-display font-bold text-navy">Total a pagar</span>
        <span className="font-display text-2xl font-bold text-blue">${summary.total.toFixed(2)}</span>
      </div>

      {totalAmount != null && (
        <p className="mt-3 rounded-lg bg-white/60 px-3 py-2 text-xs text-steel">
          Facturado por <span className="font-semibold text-navy">${totalAmount.toFixed(2)}</span> al
          cerrar la orden.
        </p>
      )}
    </div>
  );
}