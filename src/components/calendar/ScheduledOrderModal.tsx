"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Loader2, Search } from "lucide-react";
import { useVehicleLookup } from "@/hooks/useVehicleLookUp";
import HourSelect from "@/components/common/HourSelect";
import { listWarrantyClaims } from "@/lib/api/warrantyClaims";
import { CLAIM_LINKED_ORDER_TYPE_LABELS, CLAIM_LINKED_ORDER_TYPES } from "@/lib/claimLinkedOrderTypes";
import type { Bay, ServiceOrderType } from "@/types/serviceOrder";
import type { UserDirectoryEntry } from "@/types/user";
import type { WarrantyClaim } from "@/types/warrantyClaim";
import type { CreateServiceOrderInput } from "@/lib/api/serviceOrders";

interface ScheduleOrderModalProps {
  open: boolean;
  onClose: () => void;
  filialId: string;
  defaultDate: string;
  defaultTime?: string;
  defaultBayId?: string;
  hours: number[];
  bays: Bay[];
  technicians: UserDirectoryEntry[];
  advisors: UserDirectoryEntry[];
  onSubmit: (input: CreateServiceOrderInput) => Promise<void>;
}

export default function ScheduleOrderModal({
  open,
  onClose,
  filialId,
  defaultDate,
  defaultTime,
  defaultBayId,
  hours,
  bays,
  technicians,
  advisors,
  onSubmit,
}: ScheduleOrderModalProps) {
  const { clients } = useVehicleLookup(filialId);
  const [search, setSearch] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState("");
  const [bayId, setBayId] = useState("");
  const [technicianId, setTechnicianId] = useState("");
  const [notes, setNotes] = useState("");
  const [customerReason, setCustomerReason] = useState("");
  const [advisorId, setAdvisorId] = useState("");
  const [promisedDate, setPromisedDate] = useState("");
  const [promisedTime, setPromisedTime] = useState("");
  const [orderType, setOrderType] = useState<ServiceOrderType>("regular");
  const [matchingClaims, setMatchingClaims] = useState<WarrantyClaim[]>([]);
  const [warrantyClaimId, setWarrantyClaimId] = useState("");
  const [loadingClaims, setLoadingClaims] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requiredClaimType = CLAIM_LINKED_ORDER_TYPES[orderType];

  // This component stays mounted while closed, so plain useState initial
  // values only apply once — re-seed a clean form (and the clicked cell's
  // date/hour/bay, like clicking an empty slot in Google Calendar) every
  // time it actually opens, instead of carrying over whatever was left
  // from a previous open.
  useEffect(() => {
    if (!open) return;
    setSearch("");
    setSelectedVehicleId(null);
    setDate(defaultDate);
    setTime(defaultTime ?? "");
    setBayId(defaultBayId ?? "");
    setTechnicianId("");
    setNotes("");
    setCustomerReason("");
    setAdvisorId("");
    setPromisedDate("");
    setPromisedTime("");
    setOrderType("regular");
    setWarrantyClaimId("");
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultDate, defaultTime, defaultBayId]);

  useEffect(() => {
    setWarrantyClaimId("");
    if (!requiredClaimType || !selectedVehicleId) {
      setMatchingClaims([]);
      return;
    }
    let cancelled = false;
    setLoadingClaims(true);
    listWarrantyClaims(filialId, { vehicleId: selectedVehicleId, status: "autorizado" })
      .then((claims) => {
        if (cancelled) return;
        setMatchingClaims(
          claims.filter((c) => c.claim_type === requiredClaimType && !c.resulting_service_order_id)
        );
      })
      .finally(() => {
        if (!cancelled) setLoadingClaims(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filialId, requiredClaimType, selectedVehicleId]);

  const results = useMemo(() => {
    if (!search || selectedVehicleId) return [];
    const term = search.toLowerCase();
    const entries: { vehicleId: string; label: string; sub: string }[] = [];
    for (const client of clients) {
      for (const vehicle of client.vehicles) {
        const matches =
          (vehicle.plate ?? "").toLowerCase().includes(term) ||
          (vehicle.vin ?? "").toLowerCase().includes(term) ||
          vehicle.brand.toLowerCase().includes(term) ||
          vehicle.model.toLowerCase().includes(term) ||
          `${vehicle.brand} ${vehicle.model}`.toLowerCase().includes(term) ||
          client.full_name.toLowerCase().includes(term);
        if (matches) {
          entries.push({
            vehicleId: vehicle.id,
            label: `${vehicle.brand} ${vehicle.model} · ${vehicle.plate ?? "Sin placa"}`,
            sub: client.full_name,
          });
        }
      }
    }
    return entries.slice(0, 8);
  }, [search, clients, selectedVehicleId]);

  async function handleSubmit() {
    if (!selectedVehicleId || !date || !time) return;
    if (!customerReason.trim()) {
      setError("Ingresa el motivo o síntoma reportado por el cliente.");
      return;
    }
    if (!advisorId) {
      setError("Selecciona el asesor responsable.");
      return;
    }
    if (!promisedDate || !promisedTime) {
      setError("Selecciona la fecha de inicio de la ODS.");
      return;
    }
    if (requiredClaimType && !warrantyClaimId) {
      setError("Selecciona el reclamo asociado a esta orden.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        filial_id: filialId,
        vehicle_id: selectedVehicleId,
        order_type: orderType,
        warranty_claim_id: requiredClaimType ? warrantyClaimId : null,
        scheduled_at: new Date(`${date}T${time}`).toISOString(),
        bay_id: bayId || null,
        technician_user_id: technicianId || null,
        notes: notes || null,
        customer_reason: customerReason.trim(),
        advisor_user_id: advisorId,
        promised_at: new Date(`${promisedDate}T${promisedTime}`).toISOString(),
      });
      setSearch("");
      setSelectedVehicleId(null);
      setTime("");
      setBayId("");
      setTechnicianId("");
      setNotes("");
      setCustomerReason("");
      setAdvisorId("");
      setPromisedDate("");
      setPromisedTime("");
      setOrderType("regular");
      setWarrantyClaimId("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo agendar la orden.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-navy/40" />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-navy/10 px-6 py-4">
          <h2 className="font-display text-lg font-bold text-navy">Agendar Orden de Servicio</h2>
          <button onClick={onClose} aria-label="Cerrar" className="rounded-lg p-2 text-steel hover:bg-ash hover:text-navy">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Cliente / vehículo</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSelectedVehicleId(null);
                }}
                placeholder="Buscar por placa, VIN, marca, modelo o cliente..."
                className="w-full rounded-xl border border-navy/15 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
              />
            </div>
            {results.length > 0 && (
              <div className="mt-2 divide-y divide-navy/5 rounded-xl border border-navy/10">
                {results.map((r) => (
                  <button
                    key={r.vehicleId}
                    type="button"
                    onClick={() => {
                      setSelectedVehicleId(r.vehicleId);
                      setSearch(r.label);
                    }}
                    className="block w-full px-4 py-2.5 text-left text-sm transition hover:bg-ash"
                  >
                    <p className="font-medium text-navy">{r.label}</p>
                    <p className="text-xs text-steel">{r.sub}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">Fecha</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">Hora</label>
              <HourSelect value={time} onChange={setTime} hours={hours} />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Tipo de orden</label>
            <select
              value={orderType}
              onChange={(e) => setOrderType(e.target.value as ServiceOrderType)}
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
            >
              <option value="regular">Regular</option>
              {Object.entries(CLAIM_LINKED_ORDER_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {requiredClaimType && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">Reclamo asociado</label>
              <select
                value={warrantyClaimId}
                onChange={(e) => setWarrantyClaimId(e.target.value)}
                disabled={!selectedVehicleId || loadingClaims}
                className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20 disabled:bg-ash disabled:text-steel"
              >
                <option value="">
                  {!selectedVehicleId
                    ? "Selecciona un vehículo primero"
                    : loadingClaims
                      ? "Cargando reclamos..."
                      : matchingClaims.length === 0
                        ? "Sin reclamos autorizados para este vehículo"
                        : "Selecciona..."}
                </option>
                {matchingClaims.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.failure_cause || c.reported_symptom || "Sin descripción"}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-steel">
                Solo se listan reclamos autorizados de este vehículo, del tipo correspondiente y que
                todavía no se hayan convertido en otra orden.
              </p>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Bahía (opcional)</label>
            <select
              value={bayId}
              onChange={(e) => setBayId(e.target.value)}
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
            >
              <option value="">Sin asignar</option>
              {bays.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Técnico asignado (opcional)</label>
            <select
              value={technicianId}
              onChange={(e) => setTechnicianId(e.target.value)}
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
            >
              <option value="">Sin asignar</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Asesor responsable</label>
            <select
              value={advisorId}
              onChange={(e) => setAdvisorId(e.target.value)}
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
            >
              <option value="" disabled>
                Selecciona un asesor
              </option>
              {advisors.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Fecha de inicio de ODS</label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={promisedDate}
                onChange={(e) => setPromisedDate(e.target.value)}
                className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
              />
              <HourSelect value={promisedTime} onChange={setPromisedTime} hours={hours} />
            </div>
            <p className="mt-1 text-[11px] text-steel">
              El kilometraje de ingreso se registrará al vincular la inspección preliminar, desde la
              ficha de la orden, cuando el vehículo llegue.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">
              Motivo o síntoma reportado por el cliente
            </label>
            <textarea
              value={customerReason}
              onChange={(e) => setCustomerReason(e.target.value)}
              rows={2}
              placeholder="Ej: Ruido en frenos delanteros al frenar..."
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Notas</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Notas para el asesor o técnico..."
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
            />
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 border-t border-navy/10 p-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-navy/15 px-5 py-2.5 text-sm font-semibold text-navy transition hover:border-navy/40"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={
              !selectedVehicleId ||
              !date ||
              !time ||
              (!!requiredClaimType && !warrantyClaimId) ||
              submitting
            }
            className="flex items-center justify-center gap-2 rounded-full bg-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Agendar Orden de Servicio
          </button>
        </div>
      </div>
    </div>
  );
}