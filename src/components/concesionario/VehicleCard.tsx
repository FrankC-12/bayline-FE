import { ChevronRight, ImageIcon, Trash2 } from "lucide-react";
import { STATUS_STYLES, statusLabel } from "@/lib/vehicle-catalog-dealership";
import type { DealershipVehicle } from "@/types/concesionario";

interface VehicleCardProps {
  vehicle: DealershipVehicle;
  editable?: boolean;
  onDelete?: () => void;
  onStatusChange?: (status: string) => void;
  onClick?: () => void;
}

export default function VehicleCard({ vehicle, editable, onDelete, onStatusChange, onClick }: VehicleCardProps) {
  return (
    <div onClick={onClick} role={onClick ? "button" : undefined} tabIndex={onClick ? 0 : undefined} onKeyDown={(event) => { if (onClick && (event.key === "Enter" || event.key === " ")) onClick(); }} className={`overflow-hidden rounded-2xl border border-navy/10 bg-white ${onClick ? "cursor-pointer transition hover:-translate-y-0.5 hover:border-blue/30 hover:shadow-md" : ""}`}>
      <div className="flex h-40 flex-col items-center justify-center gap-1.5 border-b border-dashed border-navy/15 bg-ash/60 text-steel">
        <ImageIcon className="h-6 w-6" />
        <span className="text-sm">Foto del vehículo</span>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-lg font-bold text-navy">
            {vehicle.brand} {vehicle.model} <span className="font-normal text-steel">{vehicle.year}</span>
          </h3>
          {editable && onDelete && (
            <button
              onClick={(event) => { event.stopPropagation(); onDelete(); }}
              aria-label="Eliminar vehículo"
              className="shrink-0 rounded-lg border border-navy/15 p-1.5 text-red-500 transition hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            {vehicle.condition === "nuevo" ? "Nuevo" : "Usado"}
          </span>
          {editable && onStatusChange ? (
            <select
              value={vehicle.status}
              onClick={(event) => event.stopPropagation()}
              onChange={(e) => onStatusChange(e.target.value)}
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold outline-none ${STATUS_STYLES[vehicle.status]}`}
            >
              {Object.entries(STATUS_STYLES).map(([value]) => (
                <option key={value} value={value}>
                  {statusLabel(value as DealershipVehicle["status"])}
                </option>
              ))}
            </select>
          ) : (
            <span
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[vehicle.status]}`}
            >
              {statusLabel(vehicle.status)}
            </span>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-y-2 text-sm">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-steel">VIN</p>
            <p className="break-all font-medium text-navy">{vehicle.vin}</p>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-steel">Placa</p>
            <p className="font-medium text-navy">{vehicle.plate ?? "—"}</p>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-steel">Color</p>
            <p className="font-medium text-navy">{vehicle.color ?? "—"}</p>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-steel">Combustible</p>
            <p className="font-medium text-navy capitalize">{vehicle.fuel_type ?? "—"}</p>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-steel">Transmisión</p>
            <p className="font-medium capitalize text-navy">{vehicle.transmission ?? "—"}</p>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-steel">SKU</p>
            <p className="font-medium text-navy">{vehicle.sku}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-navy/10 pt-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-steel">Contado</p>
            <p className="font-display font-bold text-navy">${vehicle.price_cash.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[10px] uppercase tracking-widest text-steel">Financiado</p>
            <p className="font-display font-bold text-navy">${vehicle.price_financed.toLocaleString()}</p>
          </div>
        </div>
        {onClick && <div className="mt-3 flex items-center justify-end gap-1 text-xs font-semibold text-blue">Ver detalle <ChevronRight className="h-3.5 w-3.5" /></div>}
      </div>
    </div>
  );
}
