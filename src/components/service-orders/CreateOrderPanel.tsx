"use client";

import Modal from "@/components/common/Modal";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { useVehicleLookup } from "@/hooks/useVehicleLookUp";
import { useInspections } from "@/hooks/useInspections";
import { useUserDirectory } from "@/hooks/useUserDirectory";
import { useRoleDirectory } from "@/hooks/useRoleDirectory";
import { useServiceOrderTypes } from "@/hooks/useServiceOrderTypes";
import { calendarTimestamp } from "@/lib/calendar";
import HourSelect from "@/components/common/HourSelect";
import { listWarrantyClaims } from "@/lib/api/warrantyClaims";
import type { Inspection } from "@/types/inspection";
import type { WarrantyClaim } from "@/types/warrantyClaim";

export interface CreateOrderExtra {
  customer_reason: string;
  advisor_user_id: string;
  promised_at?: string | null;
  scheduled_at: string;
  warranty_claim_id?: string | null;
}

interface CreateOrderPanelProps {
  open: boolean;
  onClose: () => void;
  filialId: string;
  // When set, the panel skips vehicle search/matching entirely and creates
  // the ODS for this exact inspection — used by the "Crear ODS" action on a
  // specific finished inspection, so it never accidentally links a
  // *different* unlinked inspection for the same vehicle.
  presetInspection?: Inspection | null;
  presetVehicleId?: string | null;
  onSubmit: (
    vehicleId: string,
    orderTypeId: string,
    extra: CreateOrderExtra,
    inspectionId: string
  ) => Promise<void>;
}

export default function CreateOrderPanel({
  open,
  onClose,
  filialId,
  presetVehicleId = null, presetInspection = null,
  onSubmit,
}: CreateOrderPanelProps) {
  const { clients } = useVehicleLookup(filialId);
  const { inspections: unlinkedInspections } = useInspections(presetInspection ? null : filialId, true);
  const { users } = useUserDirectory({ filialId });
  const { roles } = useRoleDirectory("filial");
  const { orderTypes } = useServiceOrderTypes(filialId);
  const advisorRoleId = roles.find((r) => r.slug === "asesor")?.id;
  const advisors = users.filter((u) => u.role_id === advisorRoleId);
  // "mpt"/"retrabajo" stay hidden here on purpose — mpt has no module/screen
  // behind it yet, and retrabajo is only ever set automatically when
  // converting a reclamo de garantía, never picked by hand.
  const selectableOrderTypes = orderTypes.filter((t) => t.code === "regular" && t.is_active);

  const [search, setSearch] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [orderTypeId, setOrderTypeId] = useState("");
  const [customerReason, setCustomerReason] = useState("");
  const [advisorUserId, setAdvisorUserId] = useState("");
  const [promisedDate, setPromisedDate] = useState("");
  const [promisedTime, setPromisedTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [matchingClaims, setMatchingClaims] = useState<WarrantyClaim[]>([]);
  const [warrantyClaimId, setWarrantyClaimId] = useState("");
  const [loadingClaims, setLoadingClaims] = useState(false);
  const selectedOrderType = orderTypes.find((t) => t.id === orderTypeId);
  const requiredClaimType = selectedOrderType?.claim_type ?? null;

  useEffect(() => {
    if (!orderTypeId && selectableOrderTypes.length > 0) {
      setOrderTypeId(selectableOrderTypes.find((t) => t.code === "regular")?.id ?? selectableOrderTypes[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectableOrderTypes]);

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

  const matchedInspection = useMemo(() => {
    if (presetInspection) return presetInspection;
    if (!selectedVehicleId) return null;
    const candidates = unlinkedInspections
      .filter((i) => i.vehicle_id === selectedVehicleId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return candidates[0] ?? null;
  }, [presetInspection, unlinkedInspections, selectedVehicleId]);


  const presetVehicleLabel = useMemo(() => {
    if (!presetInspection) return null;
    for (const client of clients) {
      const vehicle = client.vehicles.find((v) => v.id === presetInspection.vehicle_id);
      if (vehicle) {
        return `${vehicle.brand} ${vehicle.model} · ${vehicle.plate ?? "Sin placa"} — ${client.full_name}`;
      }
    }
    return null;
  }, [presetInspection, clients]);

  useEffect(() => {
    if (open && presetInspection) {
      setSelectedVehicleId(presetInspection.vehicle_id);
    }
  }, [open, presetInspection]);

  useEffect(()=> {
    if (!open || !presetVehicleId || presetInspection) return;
    for (const client of clients) {
      const vehicle=client.vehicles.find(item=>item.id===presetVehicleId);
      if (vehicle) {setSelectedVehicleId(vehicle.id);setSearch(`${vehicle.brand} ${vehicle.model} · ${vehicle.plate || "Sin placa"}`);break;}
    }
  },[open,presetVehicleId,presetInspection,clients]);

  function selectVehicle(vehicleId: string, label: string) {
    setSelectedVehicleId(vehicleId);
    setSearch(label);
    setCustomerReason("");
  }

  async function handleSubmit() {
    if (!selectedVehicleId) {
      setError("Selecciona un vehículo.");
      return;
    }
    if (!matchedInspection) {
      setError(
        "Este vehículo no tiene una inspección preliminar sin vincular. Realiza la inspección preliminar antes de crear la ODS."
      );
      return;
    }
    if (!customerReason.trim()) {
      setError("Ingresa el motivo o síntoma reportado por el cliente.");
      return;
    }
    if (!advisorUserId) {
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
      await onSubmit(
        selectedVehicleId,
        orderTypeId,
        {
          customer_reason: customerReason.trim(),
          advisor_user_id: advisorUserId,
          scheduled_at: calendarTimestamp(promisedDate, promisedTime),
          promised_at: null,
          warranty_claim_id: requiredClaimType ? warrantyClaimId : null,
        },
        matchedInspection.id
      );
      setSearch("");
      setSelectedVehicleId(null);
      setCustomerReason("");
      setAdvisorUserId("");
      setPromisedDate("");
      setPromisedTime("");
      setOrderTypeId("");
      setWarrantyClaimId("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la ODS.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nueva ODS" size="lg" closeDisabled={submitting} footer={<><button
            type="button"
            onClick={onClose} disabled={submitting}
            className="rounded-full border border-navy/15 px-5 py-2.5 text-sm font-semibold text-navy transition hover:border-navy/40"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={
              !selectedVehicleId ||
              !matchedInspection ||
              (!!requiredClaimType && !warrantyClaimId) ||
              submitting
            }
            className="flex items-center justify-center gap-2 rounded-full bg-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Crear ODS
          </button></>}>
      <div className="space-y-5 p-5 sm:p-7">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Cliente / vehículo</label>
            {presetInspection ? (
              <p className="w-full rounded-xl border border-navy/10 bg-ash px-4 py-2.5 text-sm font-semibold text-navy">
                {presetVehicleLabel ?? "—"}
              </p>
            ) : (
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
            )}
            {!presetInspection && results.length > 0 && (
              <div className="mt-2 divide-y divide-navy/5 rounded-xl border border-navy/10">
                {results.map((r) => (
                  <button
                    key={r.vehicleId}
                    type="button"
                    onClick={() => selectVehicle(r.vehicleId, r.label)}
                    className="block w-full px-4 py-2.5 text-left text-sm transition hover:bg-ash"
                  >
                    <p className="font-medium text-navy">{r.label}</p>
                    <p className="text-xs text-steel">{r.sub}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <p className="rounded-xl bg-blue-light/40 p-3 text-xs text-steel">Tipo de ODS: Regular. Los retrabajos, garantías de fábrica y campañas se generan desde su reclamo autorizado.</p>

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

          {selectedVehicleId && matchedInspection ? (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              Kilometraje y motivo heredados de la Inspección Preliminar del{" "}
              {new Date(matchedInspection.created_at).toLocaleDateString("es-VE")}.
            </p>
          ) : selectedVehicleId ? (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Este vehículo no tiene una inspección preliminar sin vincular. Realiza la inspección
              preliminar antes de crear la ODS.
            </p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">Kilometraje de ingreso</label>
              <p className="w-full rounded-xl border border-navy/10 bg-ash px-4 py-2.5 text-sm font-semibold text-navy">
                {matchedInspection?.mileage != null
                  ? `${matchedInspection.mileage.toLocaleString("es-VE")} km`
                  : "—"}
              </p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">Fecha de inicio de ODS</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={promisedDate}
                  onChange={(e) => setPromisedDate(e.target.value)}
                  className="w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
                />
                <HourSelect
                  value={promisedTime}
                  onChange={setPromisedTime}
                  className="w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Asesor responsable</label>
            <select
              value={advisorUserId}
              onChange={(e) => setAdvisorUserId(e.target.value)}
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
            <label className="mb-1.5 block text-sm font-medium text-navy">
              Motivo o síntoma reportado por el cliente
            </label>
              <textarea
                value={customerReason}
                onChange={(e) => setCustomerReason(e.target.value)}
                rows={3}
                placeholder="Ej: Ruido en frenos delanteros al frenar..."
                className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
              />

          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        </div>


    </Modal>
  );
}
