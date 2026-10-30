import {
  CarFront,
  Mail,
  Phone,
  Eye,
  UserRound,
  ArrowUpRight,
} from "lucide-react";
import { LEAD_ORIGINS, LEAD_INTERESTS, LEAD_STATUSES } from "@/lib/leads";
import type { Client } from "@/types/client";
import { formatDocumentId, formatCount } from "@/lib/format";

interface ClientCardProps {
  client: Client;
  onClick: () => void;
  canEdit?: boolean;
}

export default function ClientCard({ client, onClick }: ClientCardProps) {
  const preview = client.vehicles.slice(0, 2);
  const remaining = client.vehicles.length - preview.length;

  return (
    <article className="flex min-w-0 flex-col rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
      <header className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-light text-blue">
          <UserRound aria-hidden="true" className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2>
            <button
              type="button"
              onClick={onClick}
              aria-label={`Ver información de ${client.full_name}`}
              title={client.full_name}
              className="line-clamp-2 break-words text-left font-display text-lg font-bold text-navy hover:text-blue focus-visible:outline-2 focus-visible:outline-blue"
            >
              {client.full_name}
            </button>
          </h2>
          <p
            className="mt-1 truncate font-mono text-xs text-steel"
            title={formatDocumentId(
              client.document_type,
              client.document_number,
            )}
          >
            {formatDocumentId(client.document_type, client.document_number)}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${client.client_type === "empresa" ? "bg-amber-100 text-amber-800" : "bg-blue-light text-blue"}`}
        >
          {client.client_type === "empresa" ? "Empresa" : "Particular"}
        </span>
      </header>
      <div className="mt-3 flex flex-wrap gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${client.is_lead ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-700"}`}
        >
          {client.is_lead ? "Lead" : "Cliente"}
        </span>
        {client.is_lead && (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-steel">
            {LEAD_STATUSES[client.lead_status || "nuevo"]}
          </span>
        )}
      </div>
      <div className="mt-4 space-y-2 text-sm text-steel">
        <p className="flex items-center gap-2">
          <Phone aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate" title={client.phone_primary || undefined}>
            {client.phone_primary || "Sin teléfono"}
          </span>
        </p>
        <p className="flex items-center gap-2">
          <Mail aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate" title={client.email || undefined}>
            {client.email || "Sin correo registrado"}
          </span>
        </p>
      </div>
      {client.is_lead && (
        <div className="mt-4 space-y-2 rounded-xl bg-amber-50/60 p-4 text-xs text-steel">
          <p className="font-semibold text-navy">
            {LEAD_INTERESTS[client.lead_interest || "otro"]}
          </p>
          {client.lead_vehicle_interest && (
            <p className="line-clamp-2">{client.lead_vehicle_interest}</p>
          )}
          <p>
            Origen: {LEAD_ORIGINS[client.lead_origin || "registro_directo"]}
          </p>
          <p>Responsable: {client.lead_assigned_user_name || "Sin asignar"}</p>
        </div>
      )}
      {(!client.is_lead || client.vehicles.length > 0) && (
        <section
          aria-label="Vehículos registrados"
          className="mt-5 flex-1 border-t border-navy/10 pt-4"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-[10px] font-semibold uppercase tracking-wide text-steel">
              Vehículos registrados
            </h3>
            <span className="rounded-full bg-blue-light px-2 py-0.5 text-xs font-semibold text-blue">
              {formatCount(client.vehicles.length)}
            </span>
          </div>
          <div className="min-h-[104px] space-y-2">
            {preview.map((vehicle) => (
              <div
                key={vehicle.id}
                className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5"
              >
                <CarFront
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 text-blue"
                />
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-xs font-semibold text-navy"
                    title={`${vehicle.brand} ${vehicle.model} ${vehicle.year ?? ""}`}
                  >
                    {vehicle.brand} {vehicle.model} {vehicle.year ?? ""}
                  </p>
                  <p className="mt-1 truncate font-mono text-[11px] text-blue">
                    {vehicle.plate || "Sin placa"}
                  </p>
                </div>
              </div>
            ))}
            {!preview.length && (
              <p className="rounded-xl border border-dashed border-navy/15 p-4 text-sm text-steel">
                Sin vehículos registrados.
              </p>
            )}
          </div>
          <div className="mt-3 min-h-5">
            {remaining > 0 && (
              <button
                type="button"
                onClick={onClick}
                aria-label={`Ver los ${client.vehicles.length} vehículos de ${client.full_name}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue hover:underline"
              >
                +{formatCount(remaining)} vehículos más · Ver todos
                <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </section>
      )}
      <footer className="mt-auto border-t border-navy/5 pt-4">
        <button
          type="button"
          onClick={onClick}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-navy/15 px-4 py-2.5 text-sm font-semibold text-blue hover:bg-blue-light"
        >
          <Eye aria-hidden="true" className="h-4 w-4" />
          Ver información del cliente
        </button>
      </footer>
    </article>
  );
}
