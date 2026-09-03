"use client";

import { X } from "lucide-react";
import type { DealershipVehicle, VehicleSale } from "@/types/concesionario";

interface Props {
  sale: VehicleSale | null;
  vehicle: DealershipVehicle | null;
  advisorName: string;
  onClose: () => void;
}

export default function VehicleSaleDetailDrawer({ sale, vehicle, advisorName, onClose }: Props) {
  if (!sale) return null;
  const symbol = vehicle?.price_currency === "VES" ? "Bs." : "$";
  return <div className="fixed inset-0 z-50 flex justify-end"><button onClick={onClose} aria-label="Cerrar detalle" className="absolute inset-0 bg-navy/40" /><aside className="relative h-full w-full max-w-lg overflow-y-auto bg-white shadow-2xl">
    <header className="flex items-start justify-between border-b border-navy/10 px-7 py-5"><div><p className="font-mono text-[10px] uppercase tracking-widest text-steel">Venta {sale.code}</p><h2 className="font-display text-2xl font-bold text-navy">{vehicle ? `${vehicle.brand} ${vehicle.model}` : "Venta de vehículo"}</h2></div><button onClick={onClose} className="rounded-lg p-2 text-steel hover:bg-ash"><X className="h-5 w-5" /></button></header>
    <div className="space-y-6 p-7"><section className="rounded-2xl bg-ash/60 p-5"><h3 className="mb-3 font-semibold text-navy">Datos de la venta</h3><dl className="grid grid-cols-2 gap-4 text-sm"><div><dt className="text-steel">Cliente</dt><dd className="font-medium text-navy">{sale.client_name}</dd></div><div><dt className="text-steel">Documento</dt><dd className="font-medium text-navy">{sale.client_document ?? "—"}</dd></div><div><dt className="text-steel">Fecha</dt><dd className="font-medium text-navy">{new Date(sale.created_at).toLocaleString("es-VE")}</dd></div><div><dt className="text-steel">Asesor</dt><dd className="font-medium text-navy">{advisorName}</dd></div><div><dt className="text-steel">Modalidad</dt><dd className="font-medium capitalize text-navy">{sale.sale_type}</dd></div><div><dt className="text-steel">Precio final</dt><dd className="font-bold text-navy">{symbol} {sale.final_price.toFixed(2)}</dd></div></dl></section>
    {vehicle && <section><h3 className="mb-3 font-semibold text-navy">Vehículo</h3><dl className="grid grid-cols-2 gap-4 rounded-2xl border border-navy/10 p-5 text-sm"><div><dt className="text-steel">Marca y modelo</dt><dd className="font-medium text-navy">{vehicle.brand} {vehicle.model}</dd></div><div><dt className="text-steel">Año</dt><dd className="font-medium text-navy">{vehicle.year}</dd></div><div><dt className="text-steel">VIN</dt><dd className="break-all font-medium text-navy">{vehicle.vin}</dd></div><div><dt className="text-steel">Placa</dt><dd className="font-medium text-navy">{vehicle.plate ?? "—"}</dd></div><div><dt className="text-steel">Color</dt><dd className="font-medium text-navy">{vehicle.color ?? "—"}</dd></div><div><dt className="text-steel">SKU</dt><dd className="font-medium text-navy">{vehicle.sku}</dd></div></dl></section>}
    </div>
  </aside></div>;
}
