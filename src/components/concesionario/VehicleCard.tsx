import { ChevronRight, ImageIcon, Trash2 } from "lucide-react";
import { availableStatusOptions, STATUS_STYLES, statusLabel } from "@/lib/vehicle-catalog-dealership";
import type { DealershipVehicle } from "@/types/concesionario";

interface VehicleCardProps {
  vehicle: DealershipVehicle;
  editable?: boolean;
  onDelete?: () => void;
  onStatusChange?: (status: string) => void;
  onSell?: () => void;
  onClick?: () => void;
  /** Only needed while status === "reservado" — resolved once by the
   * parent view instead of every card fetching clients/users on its own. */
  reservedClientName?: string;
  reservedByName?: string;
}

export default function VehicleCard({
  vehicle,
  editable,
  onDelete,
  onStatusChange,
  onSell,
  onClick,
  reservedClientName,
  reservedByName,
}: VehicleCardProps) {
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
              {availableStatusOptions(vehicle.status).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
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

        {vehicle.status === "reservado" && (
          <div className="mt-3 rounded-xl border border-blue/20 bg-blue-light/40 px-3 py-2 text-xs text-navy">
            <p>
              Reservado para <span className="font-semibold">{reservedClientName ?? "—"}</span> por{" "}
              <span className="font-semibold">{reservedByName ?? "—"}</span>
            </p>
            <p className="mt-0.5 text-steel">
              Abono ${Number(vehicle.deposit_amount ?? 0).toFixed(2)} · vigente hasta{" "}
              {vehicle.reservation_expires_at
                ? new Date(`${vehicle.reservation_expires_at}T12:00:00`).toLocaleDateString("es-VE")
                : "—"}
            </p>
          </div>
        )}

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
        {onSell && vehicle.status !== "vendido" && (
          <button
            onClick={(event) => { event.stopPropagation(); onSell(); }}
            className="mt-3 w-full rounded-full bg-blue px-4 py-2 text-xs font-semibold text-white transition hover:bg-navy"
          >
            Vender vehículo
          </button>
        )}
        {onClick && <div className="mt-3 flex items-center justify-end gap-1 text-xs font-semibold text-blue">Ver detalle <ChevronRight className="h-3.5 w-3.5" /></div>}
      </div>
    </div>
  );
}
