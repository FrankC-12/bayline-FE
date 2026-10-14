"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { ApiError } from "@/lib/api/client";
import { getDraftStorage, draftKey, initialClientDraft, readClientDraft, writeClientDraft, type ClientDraft, type SavedClientDraft } from "@/lib/client-draft";
import { X, Loader2, Plus } from "lucide-react";
import { formatThousands, formatVenezuelanPhone, stripThousands } from "@/lib/format";
import { useVehicleCatalog } from "@/hooks/useVehicleCatalog";
import type { Client } from "@/types/client";
import type { CreateClientInput, VehicleInput as ApiVehicleInput } from "@/lib/api/clients";
import { emptyVehicle, isPlateInvalid, plateForSubmit, type VehicleFormValue } from "@/types/client-form";
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
  readOnly?: boolean;
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
  readOnly = false,
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
  const [isHoldingBilling, setIsHoldingBilling] = useState(false);
  const [vehicles, setVehicles] = useState<VehicleFormValue[]>([emptyVehicle()]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const { brands } = useVehicleCatalog(filialId);

  const {currentUser} = useAuth();
  const key = draftKey(currentUser?.userId ?? "anonymous", filialId, editingClient?.id);
  const [readyKey, setReadyKey] = useState<string | null>(null);
  const [availableDraft, setAvailableDraft] = useState<SavedClientDraft | null>(null);
  const [baseVersion, setBaseVersion] = useState<string | null>(null);
  const [storageFailed, setStorageFailed] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);
  const [confirmClose, setConfirmClose] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const baseline = useRef("");
  const submitLock = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const pendingNavigation = useRef<string | null>(null);
  const data: ClientDraft = {fullName, clientType, documentType, documentNumber, email, phonePrimary,
    phoneSecondary, contactPreference, address, addressType, isHoldingBilling, vehicles};
  const serialized = JSON.stringify(data);
  const dirty = readyKey === key && !availableDraft && serialized !== baseline.current;
  const latest = useRef({key, data, dirty, baseVersion, ready: false});
  latest.current = {key, data, dirty, baseVersion, ready: open && readyKey === key && !readOnly && !!currentUser && !availableDraft};

  function applyDraft(draft: ClientDraft) {
    setFullName(draft.fullName); setClientType(draft.clientType); setDocumentType(draft.documentType);
    setDocumentNumber(draft.documentNumber); setEmail(draft.email); setPhonePrimary(draft.phonePrimary);
    setPhoneSecondary(draft.phoneSecondary); setContactPreference(draft.contactPreference);
    setAddress(draft.address); setAddressType(draft.addressType); setIsHoldingBilling(draft.isHoldingBilling);
    setVehicles(draft.vehicles);
  }
  useEffect(() => {
    if (!open) {setReadyKey(null); return;}
    const initial = initialClientDraft(editingClient);
    baseline.current = JSON.stringify(initial);
    applyDraft(initial); setBaseVersion(editingClient?.updated_at ?? null);
    setErrors([]); setFieldErrors({}); setConfirmClose(false); setStorageFailed(false); setSavedSnapshot(null);
    setAvailableDraft(readOnly || !currentUser ? null : readClientDraft(getDraftStorage(), key));
    setReadyKey(key);
    // Reinitialize on opening a different record; edits stay local otherwise.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, key, readOnly]);
  useEffect(() => {
    if (!open || readOnly || readyKey !== key || !dirty || submitting || !currentUser || availableDraft) return;
    const timer = setTimeout(() => {
      const saved = writeClientDraft(getDraftStorage(), key, data, baseVersion);
      setStorageFailed(!saved); if (saved) setSavedSnapshot(serialized);
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, readOnly, readyKey, key, dirty, serialized, baseVersion, submitting, availableDraft]);
  useEffect(() => {
    const flush = () => {
      const value = latest.current;
      if (value.ready && value.dirty) writeClientDraft(getDraftStorage(), value.key, value.data, value.baseVersion);
    };
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!latest.current.ready || !latest.current.dirty) return;
      flush(); event.preventDefault(); event.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => {window.removeEventListener("beforeunload", beforeUnload); flush();};
  }, []);
  useEffect(() => {
    if (!open || readOnly) return;
    const onLink = (event: MouseEvent) => {
      if (!latest.current.dirty || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element ? event.target.closest("a[href]") as HTMLAnchorElement | null : null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin || (destination.pathname === window.location.pathname && destination.search === window.location.search)) return;
      event.preventDefault(); event.stopPropagation();
      pendingNavigation.current = destination.href;
      setConfirmClose(true);
    };
    document.addEventListener("click", onLink, true);
    return () => document.removeEventListener("click", onLink, true);
  }, [open, readOnly]);
  function requestClose() {
    if (submitting) return;
    if (!readOnly && dirty) {setConfirmClose(true); return;}
    onClose();
  }
  function closeWithDraft() {
    const saved = writeClientDraft(getDraftStorage(), key, data, baseVersion);
    if (!saved && !storageFailed) {setStorageFailed(true); return;}
    setConfirmClose(false); onClose();
    if (pendingNavigation.current) window.location.assign(pendingNavigation.current);
  }
  function fieldError(field: string) {
    return fieldErrors[field] ? <p id={`error-${field}`} role="alert" className="mt-1 text-xs text-red-700">{fieldErrors[field]}</p> : null;
  }
  function focusError(issues: Record<string, string>) {
    requestAnimationFrame(() => {
      const first = Object.keys(issues)[0];
      const control = Array.from(formRef.current?.querySelectorAll<HTMLElement>("[data-field]") ?? [])
        .find((element) => element.dataset.field === first || (first?.startsWith("vehicles.") && first.startsWith(`${element.dataset.field}.`)));
      (control?.matches("input,select") ? control : control?.querySelector<HTMLElement>("input,select,button"))?.focus();
    });
  }

  function updateVehicle(index: number, patch: Partial<VehicleFormValue>) {
    setVehicles((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  }

  function addVehicle() {
    setVehicles((prev) => [...prev, emptyVehicle()]);
  }

  function removeVehicle(index: number) {
    setVehicles((prev) => prev.filter((_, i) => i !== index));
  }

  function validate(): Record<string, string> {
    const issues: Record<string, string> = {};

    if (fullName.trim().length < 2) issues.full_name = "El nombre completo es obligatorio.";

    const docDigits = stripThousands(documentNumber);
    if (docDigits.length < 6 || docDigits.length > 9) {
      issues.document_number = "La cédula/RIF debe tener entre 6 y 9 dígitos.";
    }

    const phoneDigits = phonePrimary.replace(/\D/g, "");
    if (phoneDigits.length !== 11 || !phoneDigits.startsWith("0")) {
      issues.phone_primary = "El teléfono principal debe tener 11 dígitos y empezar con 0.";
    }

    if (phoneSecondary) {
      const secDigits = phoneSecondary.replace(/\D/g, "");
      if (secDigits.length !== 11 || !secDigits.startsWith("0")) {
        issues.phone_secondary = "El teléfono adicional debe tener 11 dígitos y empezar con 0.";
      }
    }

    if (address.trim().length < 3) issues.address = "La dirección es obligatoria.";

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      issues.email = "El correo electrónico no es válido.";
    }

    vehicles.forEach((v, i) => {
      if (!v.brand.trim() || !v.model.trim()) {
        issues[`vehicles.${i}.brand`] = `Vehículo ${i + 1}: marca y modelo son obligatorios.`;
      }
      if (isPlateInvalid(v)) {
        issues[`vehicles.${i}.plate`] = `Vehículo ${i + 1}: la placa venezolana no tiene un formato válido.`;
      }
      if (v.vin && v.vin.length !== 17) {
        issues[`vehicles.${i}.vin`] = `Vehículo ${i + 1}: el VIN debe tener exactamente 17 caracteres.`;
      }
    });

    return issues;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Guards against a double-click/double-Enter submitting twice before
    // the disabled attribute below has a chance to re-render — synchronous
    // and independent of any render timing, unlike relying on `disabled`
    // alone.
    if (submitLock.current || readOnly) return;
    const issues = validate();
    if (Object.keys(issues).length > 0) {
      setFieldErrors(issues); setErrors([]); focusError(issues);
      return;
    }

    submitLock.current = true;
    setSubmitting(true);
    setErrors([]); setFieldErrors({});
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
        plate: plateForSubmit(v),
        color: v.color || null,
        upholstery: v.upholstery || null,
        fuel_type: v.fuelType || null,
        transmission: v.transmission || null,
      }));

      await onSubmit({
        filial_id: filialId,
        expected_updated_at: baseVersion ?? undefined,
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
        is_holding_billing: clientType === "empresa" && isHoldingBilling,
        vehicles: vehiclesPayload,
      });
      baseline.current = serialized;
      latest.current.dirty = false;
      try {getDraftStorage()?.removeItem(key);} catch {}
      setAvailableDraft(null);
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        const issues = Object.fromEntries(err.fieldErrors.filter((item) => item.field).map((item) => [item.field!, item.message]));
        if (err.errorCode === "document_already_exists") issues.document_number = err.message;
        setFieldErrors(issues); focusError(issues);
      }
      setErrors([err instanceof Error ? err.message : "No se pudo guardar el cliente."]);
    } finally {
      submitLock.current = false;
      setSubmitting(false);
    }
  }

  return (
    <div
      className={`fixed inset-0 z-50 transition ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <div
        onClick={requestClose}
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
              {editingClient ? (readOnly ? "Detalle del cliente" : "Editar cliente") : "Nuevo cliente"}
            </h2>
            <p className="text-xs text-steel">Los campos marcados con * son obligatorios</p>
          </div>
          <button
            onClick={requestClose}
            aria-label="Cerrar"
            className="rounded-lg p-2 text-steel hover:bg-ash hover:text-navy"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form ref={formRef} noValidate onSubmit={handleSubmit} onChangeCapture={() => setFieldErrors({})} className="flex-1 space-y-8 p-8">
          {!readOnly && availableDraft && <div className="rounded-xl bg-blue-light p-4 text-sm">
            <p>Hay un borrador guardado en esta pestaña.{availableDraft.baseVersion !== (editingClient?.updated_at ?? null) ? " El cliente cambió desde ese borrador; no se permitirá sobrescribir una versión más reciente." : ""}</p>
            <div className="mt-2 flex gap-3"><button type="button" onClick={() => {applyDraft(availableDraft.data); setBaseVersion(availableDraft.baseVersion); setAvailableDraft(null);}} className="font-semibold text-blue">Recuperar</button>
            <button type="button" onClick={() => {try {getDraftStorage()?.removeItem(key);} catch {} setAvailableDraft(null);}} className="text-steel">Descartar borrador</button></div>
          </div>}
          {!readOnly && <p className="text-xs text-steel">{storageFailed ? "El navegador no permite guardar el borrador. Mantén esta pestaña abierta." : dirty && savedSnapshot !== serialized ? "Conservando borrador…" : dirty ? "Borrador conservado en esta pestaña; todavía no se ha guardado en el servidor." : "Los cambios se conservarán como borrador en esta pestaña."}</p>}
          <fieldset disabled={readOnly || submitting || !!availableDraft} className="contents">
          <div>
            <p className="mb-4 font-mono text-[11px] uppercase tracking-widest text-blue">
              Datos del cliente
            </p>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy">Nombre completo *</label>
                <input
                  required
                  data-field="full_name" aria-invalid={!!fieldErrors.full_name} aria-describedby={fieldErrors.full_name ? "error-full_name" : undefined}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej: José Ramírez"
                  className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
                />
                  {fieldError("full_name")}
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
                    data-field="document_number" aria-invalid={!!fieldErrors.document_number} aria-describedby={fieldErrors.document_number ? "error-document_number" : undefined}
                  value={formatThousands(documentNumber)}
                    onChange={(e) => setDocumentNumber(stripThousands(e.target.value))}
                    placeholder="12.345.678"
                    className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
                  />
                  {fieldError("document_number")}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy">Correo electrónico</label>
                <input
                  type="email"
                  data-field="email" aria-invalid={!!fieldErrors.email} aria-describedby={fieldErrors.email ? "error-email" : undefined}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cliente@correo.com"
                  className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
                />
                  {fieldError("email")}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy">Teléfono principal *</label>
                <input
                  required
                  inputMode="numeric"
                  data-field="phone_primary" aria-invalid={!!fieldErrors.phone_primary} aria-describedby={fieldErrors.phone_primary ? "error-phone_primary" : undefined}
                  value={formatVenezuelanPhone(phonePrimary)}
                  onChange={(e) => setPhonePrimary(e.target.value.replace(/\D/g, "").slice(0, 11))}
                  placeholder="(0414) 123-4567"
                  className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
                />
                  {fieldError("phone_primary")}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy">Otro teléfono</label>
                <input
                  inputMode="numeric"
                  data-field="phone_secondary" aria-invalid={!!fieldErrors.phone_secondary} aria-describedby={fieldErrors.phone_secondary ? "error-phone_secondary" : undefined}
                  value={formatVenezuelanPhone(phoneSecondary)}
                  onChange={(e) => setPhoneSecondary(e.target.value.replace(/\D/g, "").slice(0, 11))}
                  placeholder="(0212) 765-4321"
                  className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
                />
                  {fieldError("phone_secondary")}
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
                  data-field="address" aria-invalid={!!fieldErrors.address} aria-describedby={fieldErrors.address ? "error-address" : undefined}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Av. Bolívar, edificio, sector, ciudad..."
                  className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
                />
                  {fieldError("address")}
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

              {clientType === "empresa" && (
                <label className="flex items-start gap-2.5 rounded-xl border border-navy/15 px-4 py-3 text-sm sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={isHoldingBilling}
                    onChange={(e) => setIsHoldingBilling(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-navy/30 text-blue focus:ring-blue"
                  />
                  <span>
                    <span className="font-medium text-navy">Este cliente representa al Holding</span>
                    <span className="block text-xs text-steel">
                      Úsalo para facturar trabajos de garantía de fábrica en vez de al dueño del vehículo. Aparece como opción al facturar una orden.
                    </span>
                  </span>
                </label>
              )}
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="font-mono text-[11px] uppercase tracking-widest text-blue">Vehículos</p>
            </div>
            <div className="space-y-4">
              {vehicles.map((v, i) => (
                <div key={i} data-field={`vehicles.${i}`}>
                <VehicleFields
                  index={i}
                  value={v}
                  brands={brands}
                  onChange={updateVehicle}
                  onRemove={removeVehicle}
                  canRemove={vehicles.length > 0}
                />
                {Object.entries(fieldErrors).filter(([field]) => field.startsWith(`vehicles.${i}.`)).map(([field, message]) => <p key={field} role="alert" className="mt-1 text-xs text-red-700">{message}</p>)}
                </div>
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

          </fieldset>
          <div className="flex justify-end gap-3 border-t border-navy/10 pt-6">
            <button
              type="button"
              onClick={requestClose}
              className="rounded-full border border-navy/15 px-5 py-2.5 text-sm font-semibold text-navy transition hover:border-navy/40"
            >
              Cancelar
            </button>
            {!readOnly && <button
              type="submit"
              disabled={submitting}
              className="flex items-center justify-center gap-2 rounded-full bg-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-70"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Guardar
            </button>}
          </div>
        </form>
      </aside>
      <ConfirmDialog open={confirmClose} title="Cambios sin guardar" description={storageFailed ? "No se pudo conservar el borrador. Si cierras, puedes perder los cambios." : "Los cambios aún no están en el servidor. Puedes cerrar y conservar el borrador en esta pestaña."}
        confirmLabel={storageFailed ? "Cerrar sin conservar" : "Cerrar y conservar borrador"} cancelLabel="Seguir editando" onConfirm={closeWithDraft} onCancel={() => {pendingNavigation.current = null; setConfirmClose(false);}} />
    </div>
  );
}
