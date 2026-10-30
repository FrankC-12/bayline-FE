"use client";
import { useState } from "react";
import { CarFront, Mail, Phone, Pencil, Search } from "lucide-react";
import Modal from "@/components/common/Modal";
import { formatDocumentId, formatCount, formatEntryDate } from "@/lib/format";
import { LEAD_ORIGINS, LEAD_INTERESTS, LEAD_STATUSES } from "@/lib/leads";
import type { Client } from "@/types/client";
export default function ClientDetailModal({
  client,
  onClose,
  onEdit,
  canEdit,
  canManageLead = canEdit,
  onFollowup,
}: {
  client: Client;
  onClose: () => void;
  onEdit: () => void;
  canEdit: boolean;
  canManageLead?: boolean;
  onFollowup?: () => void;
}) {
  const [vehicleSearch, setVehicleSearch] = useState("");
  const term = vehicleSearch.trim().toLocaleLowerCase("es");
  const vehicles = client.vehicles.filter((vehicle) =>
    [vehicle.brand, vehicle.model, vehicle.year, vehicle.plate, vehicle.vin]
      .join(" ")
      .toLocaleLowerCase("es")
      .includes(term),
  );
  const contact =
    (
      {
        whatsapp: "WhatsApp",
        llamada: "Llamada",
        correo: "Correo",
        sms: "SMS",
      } as Record<string, string>
    )[client.contact_preference ?? ""] ?? "Sin preferencia registrada";
  return (
    <Modal
      open
      onClose={onClose}
      title="Información del cliente"
      description="Datos de contacto, dirección y vehículos registrados."
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-navy/15 px-5 py-2.5 text-sm font-semibold text-navy"
          >
            Cerrar
          </button>
          {canManageLead && client.is_lead && onFollowup && (
            <button
              type="button"
              onClick={onFollowup}
              className="rounded-full border border-blue/20 bg-blue-light px-5 py-2.5 text-sm font-semibold text-blue"
            >
              Seguimiento del lead
            </button>
          )}
          {canEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-2 rounded-full bg-blue px-5 py-2.5 text-sm font-semibold text-white"
            >
              <Pencil aria-hidden="true" className="h-4 w-4" />
              Editar cliente
            </button>
          )}
        </>
      }
    >
      <div className="space-y-6 p-5 sm:p-7">
        <section className="rounded-2xl bg-slate-50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="break-words font-display text-2xl font-bold text-navy">
              {client.full_name}
            </h3>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${client.client_type === "empresa" ? "bg-amber-100 text-amber-800" : "bg-blue-light text-blue"}`}
            >
              {client.client_type === "empresa" ? "Empresa" : "Particular"}
            </span>
          </div>
          <p className="mt-2 font-mono text-sm text-steel">
            {formatDocumentId(client.document_type, client.document_number)}
          </p>
        </section>
        {client.is_lead && (
          <section className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50/50 p-5">
            <h3 className="font-semibold text-navy">
              Lead · {LEAD_STATUSES[client.lead_status || "nuevo"]}
            </h3>
            <p className="text-sm text-steel">
              {LEAD_INTERESTS[client.lead_interest || "otro"]} ·{" "}
              {LEAD_ORIGINS[client.lead_origin || "registro_directo"]}
            </p>
            {client.lead_vehicle_interest && (
              <p className="text-sm font-medium text-navy">
                {client.lead_vehicle_interest}
              </p>
            )}
            <p className="text-sm text-steel">
              Responsable: {client.lead_assigned_user_name || "Sin asignar"}
            </p>
            {client.lead_notes && (
              <p className="whitespace-pre-wrap text-sm text-steel">
                {client.lead_notes}
              </p>
            )}
            {client.lead_next_contact_at && (
              <p className="text-xs text-steel">
                Próximo contacto: {formatEntryDate(client.lead_next_contact_at)}
              </p>
            )}
          </section>
        )}
        <section>
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-blue">
            Contacto
          </h3>
          <dl className="grid gap-5 sm:grid-cols-2">
            {[
              {
                label: "Teléfono principal",
                value: client.phone_primary || "Sin registrar",
                icon: Phone,
              },
              {
                label: "Teléfono secundario",
                value: client.phone_secondary || "Sin registrar",
                icon: Phone,
              },
              {
                label: "Correo electrónico",
                value: client.email || "Sin registrar",
                icon: Mail,
              },
              { label: "Contacto preferido", value: contact, icon: Mail },
            ].map((item) => (
              <div key={item.label}>
                <dt className="flex items-center gap-2 text-xs text-steel">
                  <item.icon aria-hidden="true" className="h-3.5 w-3.5" />
                  {item.label}
                </dt>
                <dd className="mt-1.5 break-words text-sm font-semibold text-navy">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>
        <section className="border-t border-navy/10 pt-5">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-blue">
            Dirección
          </h3>
          <p className="whitespace-pre-wrap break-words text-sm text-navy">
            {client.address || "Sin dirección registrada"}
          </p>
          {client.address_type && (
            <p className="mt-2 text-xs text-steel">
              {
                (
                  {
                    hogar: "Hogar",
                    trabajo: "Trabajo",
                    otro: "Otro",
                  } as Record<string, string>
                )[client.address_type]
              }
            </p>
          )}
        </section>
        <section className="border-t border-navy/10 pt-5">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-blue">
            Vehículos registrados · {client.vehicles.length}
          </h3>
          {client.vehicles.length > 4 && (
            <label className="mb-4 flex items-center gap-2 rounded-xl border border-navy/15 px-3 py-2.5">
              <Search
                aria-hidden="true"
                className="h-4 w-4 shrink-0 text-steel"
              />
              <input
                aria-label="Buscar vehículos del cliente"
                value={vehicleSearch}
                onChange={(event) => setVehicleSearch(event.target.value)}
                placeholder="Buscar por placa, marca, modelo o VIN"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
            </label>
          )}
          {term && (
            <p role="status" className="mb-3 text-xs text-steel">
              {vehicles.length} de {client.vehicles.length} vehículos
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="flex items-start gap-3 rounded-xl border border-navy/10 bg-slate-50 p-4"
              >
                <CarFront
                  aria-hidden="true"
                  className="mt-1 h-5 w-5 shrink-0 text-blue"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-navy">
                    {vehicle.brand} {vehicle.model} {vehicle.year ?? ""}
                  </p>
                  <p className="mt-1 font-mono text-xs text-blue">
                    {vehicle.plate || "Sin placa"}
                  </p>
                  <p className="mt-1 break-all text-xs text-steel">
                    VIN: {vehicle.vin || "Sin registrar"}
                  </p>
                  {(vehicle.current_mileage ?? vehicle.mileage) != null && (
                    <p className="mt-2 text-xs text-steel">
                      {formatCount(
                        vehicle.current_mileage ?? vehicle.mileage ?? 0,
                      )}{" "}
                      km
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          {term && !vehicles.length && (
            <p className="text-sm text-steel">
              No hay vehículos que coincidan con la búsqueda.
            </p>
          )}
          {!client.vehicles.length && (
            <p className="text-sm text-steel">
              No tiene vehículos registrados.
            </p>
          )}
        </section>
      </div>
    </Modal>
  );
}
