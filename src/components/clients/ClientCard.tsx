import { Car } from "lucide-react";
import type { Client } from "@/types/client";

interface ClientCardProps {
  client: Client;
  onClick: () => void;
}

const BORDER_TINTS = ["border-l-blue", "border-l-amber", "border-l-emerald-500"];

export default function ClientCard({ client, onClick }: ClientCardProps) {
  const tint = BORDER_TINTS[client.full_name.length % BORDER_TINTS.length];

  return (
    <button
      onClick={onClick}
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
        {client.document_type}-{client.document_number}
      </p>

      <div className="mt-4 space-y-2 border-t border-navy/10 pt-4">
        {client.vehicles.length === 0 ? (
          <p className="text-sm italic text-steel">Sin vehículos registrados</p>
        ) : (
          client.vehicles.map((v) => (
            <div
              key={v.id}
              className="flex items-center gap-2 rounded-xl border border-navy/10 px-3 py-2 text-sm"
            >
              <Car className="h-4 w-4 text-steel" />
              <span className="font-medium text-navy">
                {v.brand} {v.model}
              </span>
              <span className="ml-auto font-mono text-xs text-blue">{v.plate}</span>
            </div>
          ))
        )}
      </div>
    </button>
  );
}