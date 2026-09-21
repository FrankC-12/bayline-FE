"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Camera, FileText, Loader2, Search, ShieldCheck, ShieldX, User, Car, X } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { useVehicleLookup } from "@/hooks/useVehicleLookUp";
import { useServiceOrders } from "@/hooks/useServiceOrders";
import { useTemparios } from "@/hooks/useTemparios";
import { useParts } from "@/hooks/useParts";
import { createWarrantyClaim, getWarrantyClaimContext } from "@/lib/api/warrantyClaims";
import { getOrderSummary } from "@/lib/api/serviceOrders";
import type { OrderSummary } from "@/types/serviceOrder";
import type {
  ReworkFailureCategory,
  WarrantyClaim,
  WarrantyClaimContext,
  WarrantyClaimType,
} from "@/types/warrantyClaim";

const CLAIM_TYPE_OPTIONS: { value: WarrantyClaimType; label: string; description: string }[] = [
  { value: "fabrica", label: "Fábrica / importador", description: "Cubre el fabricante o importador del vehículo." },
  {
    value: "comeback",
    label: "Trabajo previo (comeback)",
    description: "Asume la casa — el cliente vuelve por algo relacionado a un trabajo ya facturado.",
  },
  { value: "repuesto_proveedor", label: "Repuesto — proveedor", description: "El proveedor del repuesto asume el defecto." },
  { value: "campana_recall", label: "Campaña o recall", description: "El fabricante cubre por una campaña o recall activo." },
];

const FAILURE_CATEGORY_LABELS: Record<ReworkFailureCategory, string> = {
  mano_de_obra: "Mano de obra",
  repuesto_defectuoso: "Repuesto defectuoso",
  error_diagnostico: "Error de diagnóstico",
  mal_uso_cliente: "Mal uso del cliente",
  no_determinada: "No se pudo determinar",
};

const NEXT_STEP_COPY: Record<WarrantyClaimType, string> = {
  fabrica: "Un jefe de taller o gerente debe autorizarlo contra la garantía de fábrica antes de convertirlo en orden.",
  comeback: "Un jefe de taller o gerente debe autorizarlo — el taller asume el costo — antes de convertirlo en orden.",
  repuesto_proveedor: "Un jefe de taller o gerente debe autorizarlo antes de reclamarle al proveedor y convertirlo en orden.",
  campana_recall: "Un jefe de taller o gerente debe autorizarlo contra la campaña/recall antes de convertirlo en orden.",
};

interface WarrantyClaimFormProps {
  filialId: string;
  initialVehicleId?: string;
  initialServiceOrderId?: string;
  initialClaimType?: WarrantyClaimType;
  onCreated?: (claim: WarrantyClaim) => void;
}

export default function WarrantyClaimForm({
  filialId,
  initialVehicleId,
  initialServiceOrderId,
  initialClaimType,
  onCreated,
}: WarrantyClaimFormProps) {
  const toast = useToast();
  const { clients, vehicleMap } = useVehicleLookup(filialId);
  const { orders } = useServiceOrders(filialId, "all");
  const invoicedOrders = useMemo(() => orders.filter((o) => o.invoiced_at), [orders]);

  const [claimType, setClaimType] = useState<WarrantyClaimType>(initialClaimType ?? "fabrica");
  const [serviceOrderId, setServiceOrderId] = useState(initialServiceOrderId ?? "");
  const [orderSearch, setOrderSearch] = useState("");
  const [vehicleId, setVehicleId] = useState(initialVehicleId ?? "");
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [orderSummary, setOrderSummary] = useState<OrderSummary | null>(null);

  const [temparioId, setTemparioId] = useState("");
  const [partId, setPartId] = useState("");
  const [freeTemparioSearch, setFreeTemparioSearch] = useState("");
  const [freePartSearch, setFreePartSearch] = useState("");
  const { temparios: freeTemparios } = useTemparios(filialId, freeTemparioSearch || undefined);
  const { parts } = useParts(filialId);

  const [failureCategory, setFailureCategory] = useState<ReworkFailureCategory | "">("");
  const [failureCause, setFailureCause] = useState("");
  const [reportedSymptom, setReportedSymptom] = useState("");
  const [reportedMileage, setReportedMileage] = useState("");
  const [mileageTouched, setMileageTouched] = useState(false);
  const [claimedAt, setClaimedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [documents, setDocuments] = useState<File[]>([]);

  const [context, setContext] = useState<WarrantyClaimContext | null>(null);
  const [contextLoading, setContextLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<WarrantyClaim | null>(null);

  const isComeback = claimType === "comeback";
  const needsFailureCause = claimType === "comeback" || claimType === "repuesto_proveedor";

  const selectedOrder = orders.find((o) => o.id === serviceOrderId) ?? null;
  const vehicleEntry = vehicleId ? vehicleMap.get(vehicleId) : undefined;

  const photoPreviews = useMemo(() => photos.map((file) => URL.createObjectURL(file)), [photos]);
  useEffect(() => () => photoPreviews.forEach((url) => URL.revokeObjectURL(url)), [photoPreviews]);

  // Picking a service order always derives the vehicle from it — a claim
  // never disagrees with the order it's attached to about which car it is.
  useEffect(() => {
    if (selectedOrder) setVehicleId(selectedOrder.vehicle_id);
  }, [selectedOrder]);

  useEffect(() => {
    if (!serviceOrderId) {
      setOrderSummary(null);
      return;
    }
    let active = true;
    getOrderSummary(serviceOrderId).then((data) => {
      if (active) setOrderSummary(data);
    });
    return () => {
      active = false;
    };
  }, [serviceOrderId]);

  useEffect(() => {
    if (!vehicleId) {
      setContext(null);
      return;
    }
    let active = true;
    setContextLoading(true);
    getWarrantyClaimContext(vehicleId, serviceOrderId || undefined, temparioId || undefined, partId || undefined)
      .then((data) => {
        if (!active) return;
        setContext(data);
        if (!mileageTouched && data.current_mileage != null) {
          setReportedMileage(String(data.current_mileage));
        }
      })
      .finally(() => {
        if (active) setContextLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleId, serviceOrderId, temparioId, partId]);

  const orderResults =
    orderSearch.trim() && !serviceOrderId
      ? invoicedOrders.filter((o) => o.code.toLowerCase().includes(orderSearch.trim().toLowerCase())).slice(0, 6)
      : [];

  const vehicleResults =
    vehicleSearch.trim() && !vehicleId
      ? clients.flatMap((client) =>
          client.vehicles
            .filter(
              (v) =>
                (v.plate ?? "").toLowerCase().includes(vehicleSearch.trim().toLowerCase()) ||
                (v.vin ?? "").toLowerCase().includes(vehicleSearch.trim().toLowerCase()) ||
                client.full_name.toLowerCase().includes(vehicleSearch.trim().toLowerCase())
            )
            .map((v) => ({ vehicle: v, client }))
        ).slice(0, 6)
      : [];

  const orderPartIds = Array.from(
    new Set(orderSummary?.transfers.flatMap((t) => t.lines.map((l) => l.part_id)) ?? [])
  );

  const reportedMileageNum = reportedMileage.trim() === "" ? null : Number(reportedMileage);
  const mileageInconsistent =
    reportedMileageNum != null &&
    context?.current_mileage != null &&
    reportedMileageNum < context.current_mileage;

  function resetVehicleAndOrder() {
    setServiceOrderId("");
    setVehicleId("");
    setOrderSearch("");
    setVehicleSearch("");
    setTemparioId("");
    setPartId("");
    setContext(null);
  }

  function addPhotos(files: FileList | null) {
    if (!files) return;
    setPhotos((prev) => [...prev, ...Array.from(files)]);
  }
  function addDocuments(files: FileList | null) {
    if (!files) return;
    setDocuments((prev) => [...prev, ...Array.from(files)]);
  }

  function fail(message: string) {
    setError(message);
    toast.error(message);
  }

  async function handleSubmit() {
    if (isComeback && !serviceOrderId) {
      fail("Un reclamo tipo comeback debe referenciar la orden de servicio de origen.");
      return;
    }
    if (!vehicleId) {
      fail("Selecciona el vehículo (directamente o a través de una orden de servicio).");
      return;
    }
    if (needsFailureCause && failureCause.trim().length < 3) {
      fail("Describe la causa de la falla (mínimo 3 caracteres).");
      return;
    }
    if (!needsFailureCause && reportedSymptom.trim().length < 3) {
      fail("Describe el síntoma reportado (mínimo 3 caracteres).");
      return;
    }
    if (reportedMileageNum == null || reportedMileageNum < 0) {
      fail("Indica el kilometraje.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await createWarrantyClaim(
        {
          claim_type: claimType,
          vehicle_id: vehicleId,
          service_order_id: serviceOrderId || null,
          tempario_id: temparioId || null,
          part_id: partId || null,
          failure_category: failureCategory || null,
          failure_cause: needsFailureCause ? failureCause.trim() : null,
          reported_symptom: needsFailureCause ? null : reportedSymptom.trim(),
          reported_mileage: reportedMileageNum,
          claimed_at: claimedAt,
          note: note.trim() || null,
        },
        photos,
        documents
      );
      setCreated(result);
      onCreated?.(result);
      toast.success(`Reclamo ${result.code} registrado — quedó como Solicitado.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar el reclamo.");
    } finally {
      setSubmitting(false);
    }
  }

  if (created) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          <p className="font-display text-lg font-bold text-navy">Reclamo {created.code} registrado</p>
        </div>
        <p className="mt-2 text-sm text-steel">
          Estado: <span className="font-semibold text-navy">Solicitado</span>. {NEXT_STEP_COPY[created.claim_type]}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-navy/10 bg-white p-6">
      <p className="font-display text-lg font-bold text-navy">Nuevo reclamo de garantía</p>

      <div className="mt-4">
        <label className="mb-1.5 block text-sm font-medium text-navy">Tipo de garantía</label>
        <div className="grid gap-2 sm:grid-cols-2">
          {CLAIM_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setClaimType(opt.value)}
              className={`rounded-xl border p-3 text-left text-sm transition ${
                claimType === opt.value ? "border-blue bg-blue-light/40" : "border-navy/15 hover:border-blue/40"
              }`}
            >
              <p className="font-semibold text-navy">{opt.label}</p>
              <p className="mt-0.5 text-xs text-steel">{opt.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <label className="mb-1.5 block text-sm font-medium text-navy">
          Orden de servicio de origen {isComeback ? "(obligatoria)" : "(opcional)"}
        </label>
        {selectedOrder ? (
          <div className="flex items-center justify-between rounded-xl bg-ash p-3 text-sm">
            <span className="font-semibold text-navy">{selectedOrder.code}</span>
            {!initialServiceOrderId && (
              <button type="button" onClick={resetVehicleAndOrder} className="text-xs font-semibold text-blue hover:text-navy">
                Cambiar
              </button>
            )}
          </div>
        ) : (
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" />
            <input
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              placeholder="Código de la ODS (ej. ODS-2041)..."
              className="w-full rounded-xl border border-navy/15 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-blue"
            />
            {orderResults.length > 0 && (
              <div className="absolute z-10 mt-1 w-full divide-y divide-navy/5 rounded-xl border border-navy/10 bg-white shadow-lg">
                {orderResults.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => {
                      setServiceOrderId(o.id);
                      setOrderSearch("");
                    }}
                    className="block w-full px-4 py-2 text-left text-sm hover:bg-ash"
                  >
                    <span className="font-mono text-blue">{o.code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {!serviceOrderId && (
        <div className="mt-5">
          <label className="mb-1.5 block text-sm font-medium text-navy">Vehículo</label>
          {vehicleEntry ? (
            <div className="flex items-start justify-between gap-3 rounded-xl bg-ash p-3">
              <div className="flex items-start gap-2 text-sm">
                <Car className="mt-0.5 h-4 w-4 text-blue" />
                <div>
                  <p className="font-semibold text-navy">
                    {vehicleEntry.vehicle.plate ?? "Sin placa"} · {vehicleEntry.vehicle.brand} {vehicleEntry.vehicle.model}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-steel">
                    <User className="h-3 w-3" /> {vehicleEntry.client.full_name}
                    {vehicleEntry.vehicle.vin && ` · ${vehicleEntry.vehicle.vin}`}
                  </p>
                </div>
              </div>
              <button type="button" onClick={resetVehicleAndOrder} className="shrink-0 text-xs font-semibold text-blue hover:text-navy">
                Cambiar
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" />
              <input
                value={vehicleSearch}
                onChange={(e) => setVehicleSearch(e.target.value)}
                placeholder="Buscar por placa, VIN o nombre del cliente..."
                className="w-full rounded-xl border border-navy/15 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-blue"
              />
              {vehicleResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full divide-y divide-navy/5 rounded-xl border border-navy/10 bg-white shadow-lg">
                  {vehicleResults.map(({ vehicle, client }) => (
                    <button
                      key={vehicle.id}
                      type="button"
                      onClick={() => {
                        setVehicleId(vehicle.id);
                        setVehicleSearch("");
                      }}
                      className="block w-full px-4 py-2 text-left text-sm hover:bg-ash"
                    >
                      <span className="font-semibold text-navy">{vehicle.plate ?? "Sin placa"}</span>{" "}
                      <span className="text-steel">
                        {vehicle.brand} {vehicle.model} · {client.full_name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {vehicleId && (
        <div className="mt-5 rounded-xl border border-navy/10 p-4">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-steel">
            Contexto del vehículo — verifica antes de reclamar
          </p>
          {contextLoading ? (
            <p className="text-sm text-steel">Cargando...</p>
          ) : context ? (
            <div className="space-y-2 text-sm">
              <p className="text-steel">
                Última visita:{" "}
                <span className="font-medium text-navy">
                  {context.last_visit_date
                    ? `${new Date(context.last_visit_date).toLocaleDateString("es-VE")}${
                        context.last_visit_service_order_code ? ` (${context.last_visit_service_order_code})` : ""
                      }`
                    : "sin registro"}
                </span>
              </p>
              <p className="text-steel">
                Km actual:{" "}
                <span className="font-medium text-navy">
                  {context.current_mileage != null ? `${context.current_mileage.toLocaleString("es-VE")} km` : "sin registro"}
                </span>
              </p>
              <p className="flex items-center gap-1.5 text-steel">
                {context.factory_warranty?.status === "vigente" ? (
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <ShieldX className="h-3.5 w-3.5 text-steel" />
                )}
                Garantía de fábrica:{" "}
                <span className="font-medium text-navy">
                  {context.factory_warranty
                    ? `${context.factory_warranty.status === "vigente" ? "Vigente" : "Vencida"}${
                        context.factory_warranty.expires_at
                          ? ` — vence ${new Date(context.factory_warranty.expires_at).toLocaleDateString("es-VE")}`
                          : ""
                      }`
                    : "sin garantía registrada"}
                </span>
              </p>
              {context.workshop_warranties.length > 0 && (
                <div className="text-steel">
                  Garantía de taller:
                  <ul className="mt-1 space-y-1">
                    {context.workshop_warranties.map((w) => (
                      <li key={w.id} className="flex items-center gap-1.5">
                        {w.status === "vigente" ? (
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <ShieldX className="h-3.5 w-3.5 text-steel" />
                        )}
                        <span className="font-medium text-navy">{w.tempario_name_snapshot}</span> —{" "}
                        {w.status === "vigente" ? "vigente" : "vencida"}, vence{" "}
                        {new Date(w.expires_at).toLocaleDateString("es-VE")}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {context.duplicate_open_claim && (
                <div className="mt-2 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>
                    Ya existe un reclamo abierto ({context.duplicate_open_claim.code}) para este vehículo y este
                    mismo componente — verifica que no sea un duplicado antes de continuar.
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy">Servicio implicado (opcional)</label>
          {serviceOrderId ? (
            <select value={temparioId} onChange={(e) => setTemparioId(e.target.value)} className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue">
              <option value="">Sin servicio específico</option>
              {orderSummary?.tasks.map((t) => (
                <option key={t.tempario_id} value={t.tempario_id}>
                  {t.code_snapshot} · {t.name_snapshot}
                </option>
              ))}
            </select>
          ) : (
            <div className="relative">
              <input
                value={freeTemparioSearch}
                onChange={(e) => setFreeTemparioSearch(e.target.value)}
                placeholder="Código o nombre..."
                className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
              />
              {freeTemparioSearch && freeTemparios.length > 0 && !temparioId && (
                <div className="absolute z-10 mt-1 w-full divide-y divide-navy/5 rounded-xl border border-navy/10 bg-white shadow-lg">
                  {freeTemparios.slice(0, 6).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setTemparioId(t.id);
                        setFreeTemparioSearch(`${t.code} · ${t.name}`);
                      }}
                      className="block w-full px-4 py-2 text-left text-sm hover:bg-ash"
                    >
                      <span className="font-mono text-blue">{t.code}</span> {t.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy">Repuesto implicado (opcional)</label>
          {serviceOrderId ? (
            <select value={partId} onChange={(e) => setPartId(e.target.value)} className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue">
              <option value="">Sin repuesto específico</option>
              {orderPartIds.map((id) => (
                <option key={id} value={id}>
                  {parts.find((p) => p.id === id)?.name ?? id}
                </option>
              ))}
            </select>
          ) : (
            <div className="relative">
              <input
                value={freePartSearch}
                onChange={(e) => setFreePartSearch(e.target.value)}
                placeholder="Código o nombre..."
                className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
              />
              {freePartSearch && !partId && (
                <div className="absolute z-10 mt-1 w-full divide-y divide-navy/5 rounded-xl border border-navy/10 bg-white shadow-lg">
                  {parts
                    .filter(
                      (p) =>
                        p.code.toLowerCase().includes(freePartSearch.toLowerCase()) ||
                        p.name.toLowerCase().includes(freePartSearch.toLowerCase())
                    )
                    .slice(0, 6)
                    .map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setPartId(p.id);
                          setFreePartSearch(`${p.code} · ${p.name}`);
                        }}
                        className="block w-full px-4 py-2 text-left text-sm hover:bg-ash"
                      >
                        <span className="font-mono text-blue">{p.code}</span> {p.name}
                      </button>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {needsFailureCause && (
        <div className="mt-5">
          <label className="mb-1.5 block text-sm font-medium text-navy">Causa de la falla (opcional por ahora)</label>
          <select
            value={failureCategory}
            onChange={(e) => setFailureCategory(e.target.value as ReworkFailureCategory)}
            className="mb-2 w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
          >
            <option value="">Aún no se sabe</option>
            {(Object.entries(FAILURE_CATEGORY_LABELS) as [ReworkFailureCategory, string][]).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <textarea
            value={failureCause}
            onChange={(e) => setFailureCause(e.target.value)}
            rows={2}
            placeholder="Ej: fuga de aceite tras el cambio"
            className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
          />
        </div>
      )}

      {!needsFailureCause && (
        <div className="mt-5">
          <label className="mb-1.5 block text-sm font-medium text-navy">Síntoma reportado por el cliente</label>
          <textarea
            value={reportedSymptom}
            onChange={(e) => setReportedSymptom(e.target.value)}
            rows={2}
            placeholder="Ej: ruido metálico al frenar desde ayer"
            className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
          />
        </div>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy">Kilometraje</label>
          <input
            type="number"
            min="0"
            value={reportedMileage}
            onChange={(e) => {
              setMileageTouched(true);
              setReportedMileage(e.target.value);
            }}
            className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
          />
          {context?.current_mileage != null && (
            <p className="mt-1.5 text-xs text-steel">
              Heredado del último registro: {context.current_mileage.toLocaleString("es-VE")} km
            </p>
          )}
          {mileageInconsistent && (
            <div className="mt-2 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>El kilometraje es menor al último registrado — se puede registrar igual; queda marcado para revisión.</p>
            </div>
          )}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy">Fecha del reclamo</label>
          <input
            type="date"
            value={claimedAt}
            onChange={(e) => setClaimedAt(e.target.value)}
            className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
          />
        </div>
      </div>

      <div className="mt-5">
        <label className="mb-1.5 block text-sm font-medium text-navy">Nota (opcional)</label>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue" />
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-steel">Fotos</p>
          <div className="flex flex-wrap gap-3">
            {photos.map((file, i) => (
              <div key={i} className="group relative h-16 w-16 overflow-hidden rounded-xl border border-navy/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoPreviews[i]} alt={file.name} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                  aria-label="Quitar foto"
                  className="absolute right-1 top-1 rounded-full bg-navy/70 p-1 text-white transition hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <label className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-navy/20 text-steel transition hover:border-blue/40 hover:text-blue">
              <Camera className="h-4 w-4" />
              <span className="text-[9px] font-medium">Agregar</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  addPhotos(e.target.files);
                  e.target.value = "";
                }}
                className="hidden"
              />
            </label>
          </div>
        </div>
        <div>
          <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-steel">Documentos</p>
          <div className="space-y-1.5">
            {documents.map((file, i) => (
              <div key={i} className="flex items-center justify-between gap-2 rounded-lg border border-navy/10 px-3 py-1.5 text-xs">
                <span className="flex items-center gap-1.5 truncate text-navy">
                  <FileText className="h-3.5 w-3.5 shrink-0 text-steel" />
                  {file.name}
                </span>
                <button type="button" onClick={() => setDocuments((prev) => prev.filter((_, idx) => idx !== i))} aria-label="Quitar documento">
                  <X className="h-3.5 w-3.5 text-steel hover:text-red-600" />
                </button>
              </div>
            ))}
            <label className="flex w-fit cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-navy/20 px-3 py-1.5 text-xs font-medium text-steel transition hover:border-blue/40 hover:text-blue">
              <FileText className="h-3.5 w-3.5" />
              Adjuntar documento
              <input
                type="file"
                accept="image/*,application/pdf"
                multiple
                onChange={(e) => {
                  addDocuments(e.target.files);
                  e.target.value = "";
                }}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {error && <p className="mt-5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-50"
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Registrar reclamo
      </button>
    </div>
  );
}
