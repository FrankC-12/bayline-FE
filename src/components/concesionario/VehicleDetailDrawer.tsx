"use client";

import { X } from "lucide-react";
import { STATUS_OPTIONS, STATUS_STYLES, statusLabel } from "@/lib/vehicle-catalog-dealership";
import type { DealershipVehicle } from "@/types/concesionario";

interface Props {
  vehicle: DealershipVehicle | null;
  onClose: () => void;
  onStatusChange: (status: string) => Promise<void>;
}

export default function VehicleDetailDrawer({ vehicle, onClose, onStatusChange }: Props) {
  if (!vehicle) return null;
  const symbol = vehicle.price_currency === "VES" ? "Bs." : "$";

  return <div className="fixed inset-0 z-50 flex justify-end">
    <button onClick={onClose} aria-label="Cerrar detalle" className="absolute inset-0 bg-navy/40" />
    <aside className="relative h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl">
      <header className="sticky top-0 z-10 flex items-start justify-between border-b border-navy/10 bg-white px-7 py-5">
        <div><p className="font-mono text-[10px] uppercase tracking-widest text-steel">Detalle del vehículo</p><h2 className="font-display text-2xl font-bold text-navy">{vehicle.brand} {vehicle.model}</h2><p className="text-sm text-steel">{vehicle.year} · {vehicle.sku}</p></div>
        <button onClick={onClose} className="rounded-lg p-2 text-steel hover:bg-ash"><X className="h-5 w-5" /></button>
      </header>
      <div className="space-y-6 p-7">
        <section className="rounded-2xl border border-navy/10 p-5">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-steel">Estado operativo</label>
          <select value={vehicle.status} onChange={(event) => void onStatusChange(event.target.value)} className={`w-full rounded-xl border px-4 py-3 text-sm font-semibold outline-none ${STATUS_STYLES[vehicle.status]}`}>
            {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <p className="mt-2 text-xs text-steel">Al marcarlo como vendido se solicitarán los datos de la venta.</p>
        </section>

        <section><h3 className="mb-3 font-semibold text-navy">Identificación y características</h3><dl className="grid grid-cols-2 gap-4 rounded-2xl bg-ash/60 p-5 text-sm">
          <div><dt className="text-steel">VIN</dt><dd className="break-all font-medium text-navy">{vehicle.vin}</dd></div><div><dt className="text-steel">Placa</dt><dd className="font-medium text-navy">{vehicle.plate ?? "—"}</dd></div>
          <div><dt className="text-steel">Condición</dt><dd className="font-medium capitalize text-navy">{vehicle.condition}</dd></div><div><dt className="text-steel">Color</dt><dd className="font-medium text-navy">{vehicle.color ?? "—"}</dd></div>
          <div><dt className="text-steel">Combustible</dt><dd className="font-medium capitalize text-navy">{vehicle.fuel_type ?? "—"}</dd></div><div><dt className="text-steel">Transmisión</dt><dd className="font-medium capitalize text-navy">{vehicle.transmission ?? "—"}</dd></div>
        </dl></section>

        <section><h3 className="mb-3 font-semibold text-navy">Precios e impuestos</h3><dl className="space-y-2 rounded-2xl border border-navy/10 p-5 text-sm">
          <div className="flex justify-between"><dt>PVP contado</dt><dd className="font-semibold">{symbol} {vehicle.price_cash.toFixed(2)}</dd></div>
          <div className="flex justify-between"><dt>IVA ({vehicle.iva_percentage}%)</dt><dd>{symbol} {vehicle.iva_amount.toFixed(2)}</dd></div>
          {vehicle.price_currency === "USD" && <div className="flex justify-between"><dt>IGTF ({vehicle.igtf_percentage}%)</dt><dd>{symbol} {vehicle.igtf_amount.toFixed(2)}</dd></div>}
          {vehicle.luxury_tax_percentage > 0 && <div className="flex justify-between"><dt>Impuesto al lujo ({vehicle.luxury_tax_percentage}%)</dt><dd>{symbol} {vehicle.luxury_tax_amount.toFixed(2)}</dd></div>}
          <div className="flex justify-between border-t border-navy/10 pt-2 font-bold text-navy"><dt>Total contado</dt><dd>{symbol} {vehicle.cash_total.toFixed(2)}</dd></div>
          <div className="flex justify-between"><dt>Precio financiado</dt><dd className="font-semibold">{symbol} {vehicle.price_financed.toFixed(2)}</dd></div>
          <div className="flex justify-between text-steel"><dt>Financiamiento</dt><dd className="capitalize">{vehicle.financing_provider ?? "Sin proveedor"}</dd></div>
          <div className="flex justify-between text-steel"><dt>Estado actual</dt><dd>{statusLabel(vehicle.status)}</dd></div>
        </dl></section>
      </div>
    </aside>
  </div>;
}
