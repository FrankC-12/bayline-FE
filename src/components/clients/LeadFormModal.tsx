"use client";
import { useState } from "react";
import Modal from "@/components/common/Modal";
import { createLead, updateLead } from "@/lib/api/clients";
import type { Client } from "@/types/client";
import { useUserDirectory } from "@/hooks/useUserDirectory";
import { LEAD_ORIGINS, LEAD_INTERESTS, LEAD_STATUSES } from "@/lib/leads";
import { formatVenezuelanPhone } from "@/lib/format";
export default function LeadFormModal({
  filialId,
  onClose,
  onSaved,
  client,
  defaultOrigin = "registro_directo",
  defaultInterest = "vehiculo",
}: {
  filialId: string;
  onClose: () => void;
  onSaved: (client: Client) => void;
  client?: Client;
  defaultOrigin?: string;
  defaultInterest?: string;
}) {
  const { users } = useUserDirectory({ filialId, activeOnly: true });
  const [name, setName] = useState("");
  const [docType, setDocType] = useState("V");
  const [document, setDocument] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [origin, setOrigin] = useState(client?.lead_origin || defaultOrigin);
  const [interest, setInterest] = useState(
    client?.lead_interest || defaultInterest,
  );
  const [vehicle, setVehicle] = useState(client?.lead_vehicle_interest || "");
  const [notes, setNotes] = useState(client?.lead_notes || "");
  const [status, setStatus] = useState(client?.lead_status || "nuevo");
  const [assignee, setAssignee] = useState(client?.lead_assigned_user_id || "");
  const [nextContact, setNextContact] = useState(
    client?.lead_next_contact_at || "",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const field =
    "mt-1.5 w-full rounded-xl border border-navy/15 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-blue focus:ring-2 focus:ring-blue/10";
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const meta = {
        lead_origin: origin,
        lead_interest: interest,
        lead_vehicle_interest: vehicle.trim() || null,
        lead_notes: notes.trim() || null,
        lead_assigned_user_id: assignee || null,
        lead_next_contact_at: nextContact || null,
      };
      const saved = client
        ? await updateLead(client.id, { ...meta, lead_status: status })
        : await createLead({
            ...meta,
            filial_id: filialId,
            full_name: name.trim(),
            document_type: docType,
            document_number: document,
            client_type:
              docType === "J" || docType === "G" ? "empresa" : "particular",
            phone_primary: phone,
            email: email.trim() || null,
          });
      onSaved(saved);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo guardar el lead.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      open
      onClose={onClose}
      title={client ? `Seguimiento · ${client.full_name}` : "Nuevo lead"}
      description={
        client
          ? "Registra el interés y el próximo contacto con esta persona."
          : "Registra a una persona interesada y comienza su seguimiento."
      }
      closeDisabled={busy}
      size="lg"
    >
      <form onSubmit={submit} className="space-y-5 p-5 sm:p-7">
        {!client && (
          <>
            <label className="block text-sm font-medium text-navy">
              Nombre y apellido o razón social *
              <input
                required
                minLength={2}
                maxLength={150}
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={field}
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-navy">
                Cédula o RIF *
                <div className="mt-1.5 flex gap-2">
                  <select
                    aria-label="Tipo de documento"
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="rounded-xl border border-navy/15 bg-white px-3 text-sm"
                  >
                    {["V", "E", "J", "G"].map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                  <input
                    required
                    aria-label="Número de documento"
                    inputMode="numeric"
                    pattern="[0-9]{6,9}"
                    maxLength={9}
                    value={document}
                    onChange={(e) =>
                      setDocument(e.target.value.replace(/\D/g, ""))
                    }
                    className={`${field} !mt-0 min-w-0`}
                  />
                </div>
              </label>
              <label className="block text-sm font-medium text-navy">
                Teléfono *
                <input
                  required
                  type="tel"
                  value={formatVenezuelanPhone(phone)}
                  maxLength={18}
                  onChange={(e) =>
                    setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))
                  }
                  placeholder="0414-1234567"
                  className={field}
                />
              </label>
            </div>
            <label className="block text-sm font-medium text-navy">
              Correo electrónico (opcional)
              <input
                type="email"
                maxLength={255}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={field}
              />
            </label>
          </>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-navy">
            Origen
            <select
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className={field}
            >
              {Object.entries(LEAD_ORIGINS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-navy">
            Interés
            <select
              value={interest}
              onChange={(e) => setInterest(e.target.value)}
              className={field}
            >
              {Object.entries(LEAD_INTERESTS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {interest === "vehiculo" && (
          <label className="block text-sm font-medium text-navy">
            Vehículo que le interesa (opcional)
            <input
              maxLength={255}
              value={vehicle}
              onChange={(e) => setVehicle(e.target.value)}
              placeholder="Ej. Toyota Hilux, pick-up usada o SUV familiar"
              className={field}
            />
          </label>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-navy">
            Responsable de seguimiento
            <select
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className={field}
            >
              <option value="">Sin asignar</option>
              {assignee && !users.some((user) => user.id === assignee) && (
                <option value={assignee}>Responsable no disponible</option>
              )}
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-navy">
            Próximo contacto (opcional)
            <input
              type="date"
              value={nextContact}
              onChange={(e) => setNextContact(e.target.value)}
              className={field}
            />
          </label>
        </div>
        {client && (
          <label className="block text-sm font-medium text-navy">
            Seguimiento
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={field}
            >
              {Object.entries(LEAD_STATUSES).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="block text-sm font-medium text-navy">
          Notas (opcional)
          <textarea
            rows={3}
            maxLength={3000}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={field}
          />
        </label>
        {error && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        <div className="flex justify-end gap-3 border-t border-navy/10 pt-4">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="rounded-full border border-navy/15 px-5 py-2.5 text-sm font-semibold text-navy"
          >
            Cancelar
          </button>
          <button
            disabled={busy}
            className="rounded-full bg-blue px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy
              ? "Guardando…"
              : client
                ? "Guardar seguimiento"
                : "Crear lead"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
