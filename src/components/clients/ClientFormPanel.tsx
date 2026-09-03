"use client";

import { useEffect, useState } from "react";
import { X, Loader2, Plus } from "lucide-react";
import { formatThousands, formatVenezuelanPhone, stripThousands } from "@/lib/format";
import { normalizeVenezuelaPlate, validateVenezuelaPlate } from "@/lib/venezuela-plate";
import type { Client } from "@/types/client";
import type { CreateClientInput, VehicleInput as ApiVehicleInput } from "@/lib/api/clients";
import { emptyVehicle, type VehicleFormValue } from "@/types/client-form";
import VehicleFields from "./VehicleFields";

const CONTACT_PREFERENCES = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "llamada", label: "Llamada telefónica" },
  { value: "correo", label: "Correo" },
  { value: "sms", label: "SMS" },
];

const ADDRESS_TYPES = [
  { value: "hogar", label: "Hogar" },
  { value: "trabajo", label: "Trabajo" },
  { value: "otro", label: "Otro" },
];

interface ClientFormPanelProps {
  open: boolean;
  onClose: () => void;
  filialId: string;
  onSubmit: (input: CreateClientInput) => Promise<void>;
  editingClient: Client | null;
}

export default function ClientFormPanel({
  open,
  onClose,
  filialId,
  onSubmit,
  editingClient,
}: ClientFormPanelProps) {
  const [fullName, setFullName] = useState("");
  const [clientType, setClientType] = useState<"particular" | "empresa">("particular");
  const [documentType, setDocumentType] = useState<"V" | "J" | "E" | "G">("V");
  const [documentNumber, setDocumentNumber] = useState("");
  const [email, setEmail] = useState("");
  const [phonePrimary, setPhonePrimary] = useState("");
  const [phoneSecondary, setPhoneSecondary] = useState("");
  const [contactPreference, setContactPreference] = useState("");
  const [address, setAddress] = useState("");
  const [addressType, setAddressType] = useState("hogar");
  const [vehicles, setVehicles] = useState<VehicleFormValue[]>([emptyVehicle()]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (editingClient) {
      setFullName(editingClient.full_name);
      setClientType(editingClient.client_type);
      setDocumentType(editingClient.document_type);
      setDocumentNumber(editingClient.document_number);
      setEmail(editingClient.email ?? "");
      setPhonePrimary(editingClient.phone_primary);
      setPhoneSecondary(editingClient.phone_secondary ?? "");
      setContactPreference(editingClient.contact_preference ?? "");
      setAddress(editingClient.address);
      setAddressType(editingClient.address_type ?? "hogar");
      setVehicles(
        editingClient.vehicles.length
          ? editingClient.vehicles.map((v) => ({
              id: v.id,
              brand: v.brand,
              model: v.model,
              year: v.year?.toString() ?? "",
              vin: v.vin ?? "",
              mileage: v.mileage?.toString() ?? "",
              purchaseDate: v.purchase_date ?? "",
              bodyType: v.body_type ?? "",
              plate: v.plate,
              color: v.color ?? "",
              upholstery: v.upholstery ?? "",
              fuelType: v.fuel_type ?? "",
              transmission: v.transmission ?? "",
            }))
          : [emptyVehicle()]
      );
    } else {
      setFullName("");
      setClientType("particular");
      setDocumentType("V");
      setDocumentNumber("");
      setEmail("");
      setPhonePrimary("");
      setPhoneSecondary("");
      setContactPreference("");
      setAddress("");
      setAddressType("hogar");
      setVehicles([]);
    }
    setErrors([]);
  }, [editingClient, open]);

  function updateVehicle(index: number, patch: Partial<VehicleFormValue>) {
    setVehicles((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  }

  function addVehicle() {
    setVehicles((prev) => [...prev, emptyVehicle()]);
  }

  function removeVehicle(index: number) {
    setVehicles((prev) => prev.filter((_, i) => i !== index));
  }

  function validate(): string[] {
    const issues: string[] = [];

    if (fullName.trim().length < 2) issues.push("El nombre completo es obligatorio.");

    const docDigits = stripThousands(documentNumber);
    if (docDigits.length < 6 || docDigits.length > 9) {
      issues.push("La cédula/RIF debe tener entre 6 y 9 dígitos.");
    }

    const phoneDigits = phonePrimary.replace(/\D/g, "");
    if (phoneDigits.length !== 11 || !phoneDigits.startsWith("0")) {
      issues.push("El teléfono principal debe tener 11 dígitos y empezar con 0.");
    }

    if (phoneSecondary) {
      const secDigits = phoneSecondary.replace(/\D/g, "");
      if (secDigits.length !== 11 || !secDigits.startsWith("0")) {
        issues.push("El teléfono adicional debe tener 11 dígitos y empezar con 0.");
      }
    }

    if (address.trim().length < 3) issues.push("La dirección es obligatoria.");

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      issues.push("El correo electrónico no es válido.");
    }

    vehicles.forEach((v, i) => {
      if (!v.brand.trim() || !v.model.trim()) {
        issues.push(`Vehículo ${i + 1}: marca y modelo son obligatorios.`);
      }
      if (!validateVenezuelaPlate(v.plate).valid) {
        issues.push(`Vehículo ${i + 1}: la placa venezolana no tiene un formato válido.`);
      }
      if (v.vin && v.vin.length !== 17) {
        issues.push(`Vehículo ${i + 1}: el VIN debe tener exactamente 17 caracteres.`);
      }
    });

    return issues;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const issues = validate();
    if (issues.length > 0) {
      setErrors(issues);
      return;
    }

    setSubmitting(true);
    setErrors([]);
    try {
      const vehiclesPayload: ApiVehicleInput[] = vehicles.map((v) => ({
        id: v.id,
        brand: v.brand.trim(),
        model: v.model.trim(),
        year: v.year ? Number(v.year) : null,
        vin: v.vin || null,
        mileage: v.mileage ? Number(stripThousands(v.mileage)) : null,
        purchase_date: v.purchaseDate || null,
        body_type: v.bodyType || null,
        plate: normalizeVenezuelaPlate(v.plate),
        color: v.color || null,
        upholstery: v.upholstery || null,
        fuel_type: v.fuelType || null,
        transmission: v.transmission || null,
      }));

      await onSubmit({
        filial_id: filialId,
        full_name: fullName.trim(),
        client_type: clientType,
        document_type: documentType,
        document_number: stripThousands(documentNumber),
        email: email || null,
        phone_primary: phonePrimary.replace(/\D/g, ""),
        phone_secondary: phoneSecondary ? phoneSecondary.replace(/\D/g, "") : null,
        contact_preference: contactPreference || null,
        address: address.trim(),
        address_type: addressType || null,
        vehicles: vehiclesPayload,
      });
      onClose();
    } catch (err) {
      setErrors([err instanceof Error ? err.message : "No se pudo guardar el cliente."]);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className={`fixed inset-0 z-50 transition ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-navy/40 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
      />

      <aside
        className={`absolute inset-y-0 right-0 flex w-full max-w-4xl flex-col overflow-y-auto bg-white shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-navy/10 px-8 py-5">
          <div>
            <h2 className="font-display text-xl font-bold text-navy">
              {editingClient ? "Editar cliente" : "Nuevo cliente"}
            </h2>
            <p className="text-xs text-steel">Los campos marcados con * son obligatorios</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-lg p-2 text-steel hover:bg-ash hover:text-navy"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 space-y-8 p-8">
          <div>
            <p className="mb-4 font-mono text-[11px] uppercase tracking-widest text-blue">
              Datos del cliente
            </p>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy">Nombre completo *</label>
                <input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej: José Ramírez"
                  className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy">Tipo de cliente *</label>
                <select
                  value={clientType}
                  onChange={(e) => setClientType(e.target.value as "particular" | "empresa")}
                  className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
                >
                  <option value="particular">Particular</option>
                  <option value="empresa">Empresa</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy">Cédula / RIF *</label>
                <div className="flex gap-2">
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value as "V" | "J" | "E" | "G")}
                    className="w-20 rounded-xl border border-navy/15 px-2 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
                  >
                    <option value="V">V</option>
                    <option value="J">J</option>
                    <option value="E">E</option>
                    <option value="G">G</option>
                  </select>
                  <input
                    required
                    inputMode="numeric"
                    value={formatThousands(documentNumber)}
                    onChange={(e) => setDocumentNumber(stripThousands(e.target.value))}
                    placeholder="12.345.678"
                    className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy">Correo electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cliente@correo.com"
                  className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy">Teléfono principal *</label>
                <input
                  required
                  inputMode="numeric"
                  value={formatVenezuelanPhone(phonePrimary)}
                  onChange={(e) => setPhonePrimary(e.target.value.replace(/\D/g, "").slice(0, 11))}
                  placeholder="(0414) 123-4567"
                  className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy">Otro teléfono</label>
                <input
                  inputMode="numeric"
                  value={formatVenezuelanPhone(phoneSecondary)}
                  onChange={(e) => setPhoneSecondary(e.target.value.replace(/\D/g, "").slice(0, 11))}
                  placeholder="(0212) 765-4321"
                  className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy">Preferencia de contacto</label>
                <select
                  value={contactPreference}
                  onChange={(e) => setContactPreference(e.target.value)}
                  className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
                >
                  <option value="">Selecciona</option>
                  {CONTACT_PREFERENCES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-navy">Dirección *</label>
                <input
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Av. Bolívar, edificio, sector, ciudad..."
                  className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy">Tipo de dirección</label>
                <select
                  value={addressType}
                  onChange={(e) => setAddressType(e.target.value)}
                  className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
                >
                  {ADDRESS_TYPES.map((a) => (
                    <option key={a.value} value={a.value}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="font-mono text-[11px] uppercase tracking-widest text-blue">Vehículos</p>
            </div>
            <div className="space-y-4">
              {vehicles.map((v, i) => (
                <VehicleFields
                  key={i}
                  index={i}
                  value={v}
                  onChange={updateVehicle}
                  onRemove={removeVehicle}
                  canRemove={vehicles.length > 0}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={addVehicle}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-blue/30 py-3 text-sm font-semibold text-blue transition hover:border-blue/50 hover:bg-blue-light"
            >
              <Plus className="h-4 w-4" />
              Agregar vehículo
            </button>
          </div>

          {errors.length > 0 && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              <ul className="list-inside list-disc space-y-1">
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-navy/10 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-navy/15 px-5 py-2.5 text-sm font-semibold text-navy transition hover:border-navy/40"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center justify-center gap-2 rounded-full bg-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-70"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Guardar
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}
