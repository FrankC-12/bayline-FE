import { useState } from "react";
import Link from "next/link";
import { Car, CalendarClock } from "lucide-react";
import type { Client, Vehicle } from "@/types/client";
import { formatDocumentId } from "@/lib/format";
import VehicleDetailModal from "./VehicleDetailModal";

function formatVisitDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-VE", { day: "numeric", month: "long", year: "numeric" });
}

function MileageInfo({ vehicle }: { vehicle: Vehicle }) {
  if (vehicle.current_mileage == null) {
    return vehicle.mileage != null ? (
      <p className="text-xs text-steel">{vehicle.mileage.toLocaleString("es-VE")} km (registro)</p>
    ) : null;
  }

  const visitLabel = vehicle.current_mileage_visit_date
    ? `actualizado en visita del ${formatVisitDate(vehicle.current_mileage_visit_date)}`
    : null;

  return (
    <p className="text-xs text-steel">
      {vehicle.current_mileage.toLocaleString("es-VE")} km
      {visitLabel &&
        (vehicle.current_mileage_service_order_id ? (
          <>
            {" · "}
            <Link
              href={`/dashboard/servicios/${vehicle.current_mileage_service_order_id}`}
              onClick={(e) => e.stopPropagation()}
              className="text-blue hover:underline"
            >
              {visitLabel}
            </Link>
          </>
        ) : (
          <> {" · " + visitLabel}</>
        ))}
    </p>
  );
}

interface ClientCardProps {
  client: Client;
  onClick: () => void;
}

const BORDER_TINTS = ["border-l-blue", "border-l-amber", "border-l-emerald-500"];

export default function ClientCard({ client, onClick }: ClientCardProps) {
  const tint = BORDER_TINTS[client.full_name.length % BORDER_TINTS.length];
  const [detailVehicle, setDetailVehicle] = useState<Vehicle | null>(null);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
      className={`flex flex-col rounded-2xl border border-l-4 border-navy/10 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${tint}`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-lg font-bold text-navy">{client.full_name}</h3>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest ${
            client.client_type === "empresa"
              ? "bg-amber-100 text-amber-700"
              : "bg-blue-light text-blue"
          }`}
        >
          {client.client_type === "empresa" ? "Empresa" : "Particular"}
        </span>
      </div>

      <p className="mt-1 font-mono text-sm text-steel">
        {formatDocumentId(client.document_type, client.document_number)}
      </p>

      <div className="mt-4 space-y-2 border-t border-navy/10 pt-4">
        {client.vehicles.length === 0 ? (
          <p className="text-sm italic text-steel">Sin vehículos registrados</p>
        ) : (
          client.vehicles.map((v) => (
            <div key={v.id} className="rounded-xl border border-navy/10 px-3 py-2 text-sm">
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-steel" />
                <span className="font-medium text-navy">
                  {v.brand} {v.model}
                </span>
                <span className="font-mono text-xs text-blue">{v.plate}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDetailVehicle(v);
                  }}
                  title="Plan de mantenimiento y garantías"
                  className="ml-auto rounded-lg p-1 text-steel hover:bg-ash hover:text-blue"
                >
                  <CalendarClock className="h-4 w-4" />
                </button>
              </div>
              <MileageInfo vehicle={v} />
              {v.maintenance_plan_brand && (
                <p className="mt-0.5 text-xs text-steel">
                  Plan: <span className="text-navy">{v.maintenance_plan_name}</span>
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {detailVehicle && (
        <div onClick={(e) => e.stopPropagation()}>
          <VehicleDetailModal
            open
            onClose={() => setDetailVehicle(null)}
            vehicle={detailVehicle}
            filialId={client.filial_id}
          />
        </div>
      )}
    </div>
  );
}