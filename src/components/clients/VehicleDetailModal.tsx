"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Loader2, ShieldCheck, Gauge } from "lucide-react";
import { getVehiclePlanStatus, assignVehicleMaintenancePlan } from "@/lib/api/clients";
import { getVehicleWarrantyByVin } from "@/lib/api/vehicleWarranties";
import { useMaintenancePlans } from "@/hooks/useMaintenancePlans";
import { useVehicleMileageHistory } from "@/hooks/useVehicleMileageHistory";
import { ApiError } from "@/lib/api/client";
import type { Vehicle } from "@/types/client";
import type { VehiclePlanStatus } from "@/types/maintenancePlan";
import type { VehicleWarranty } from "@/types/vehicleWarranty";

const STATUS_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  vencido: "Vencido",
  cumplido: "Cumplido",
  omitido: "Omitido",
};

const STATUS_STYLES: Record<string, string> = {
  pendiente: "bg-slate-100 text-slate-600",
  vencido: "bg-red-100 text-red-700",
  cumplido: "bg-emerald-100 text-emerald-700",
  omitido: "bg-amber-100 text-amber-700",
};

const WARRANTY_STATUS_STYLES: Record<string, string> = {
  vigente: "bg-emerald-100 text-emerald-700",
  vencida: "bg-red-100 text-red-700",
};

const WARRANTY_SOURCE_LABELS: Record<string, string> = {
  venta: "Venta de vehículo nuevo",
  manual: "Carga manual",
};

interface VehicleDetailModalProps {
  open: boolean;
  onClose: () => void;
  vehicle: Vehicle;
  filialId: string;
}

type Tab = "plan" | "garantias" | "kilometraje";

export default function VehicleDetailModal({ open, onClose, vehicle, filialId }: VehicleDetailModalProps) {
  const [tab, setTab] = useState<Tab>("plan");
  const { plans } = useMaintenancePlans(filialId);
  const [status, setStatus] = useState<VehiclePlanStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { history: mileageHistory, loading: mileageLoading } = useVehicleMileageHistory(open ? vehicle.id : null);

  const [warranty, setWarranty] = useState<VehicleWarranty | null>(null);
  const [warrantyLoading, setWarrantyLoading] = useState(true);
  const [warrantyError, setWarrantyError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getVehiclePlanStatus(vehicle.id);
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el plan del vehículo.");
    } finally {
      setLoading(false);
    }
  }

  async function loadWarranty() {
    if (!vehicle.vin) {
      setWarranty(null);
      setWarrantyLoading(false);
      return;
    }
    setWarrantyLoading(true);
    setWarrantyError(null);
    try {
      const data = await getVehicleWarrantyByVin(filialId, vehicle.vin);
      setWarranty(data);
    } catch (err) {
      // A vehicle simply not having a warranty registered yet is the normal
      // case, not an error — only surface a real failure.
      if (err instanceof ApiError && err.statusCode === 404) {
        setWarranty(null);
      } else {
        setWarrantyError(err instanceof Error ? err.message : "No se pudo cargar la garantía del vehículo.");
      }
    } finally {
      setWarrantyLoading(false);
    }
  }

  useEffect(() => {
    if (open) { load(); loadWarranty(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, vehicle.id]);

  async function handleAssign(planId: string) {
    setAssigning(true);
    setError(null);
    try {
      const updated = await assignVehicleMaintenancePlan(vehicle.id, planId || null);
      setStatus(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo asignar el plan.");
    } finally {
      setAssigning(false);
    }
  }

  const matchingPlans = plans.filter((p) => p.brand === vehicle.brand);
  const otherPlans = plans.filter((p) => p.brand !== vehicle.brand);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-navy/40" />
      <div className="relative flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-navy/10 px-6 py-4">
          <div>
            <h2 className="font-display text-xl font-bold text-navy">
              {vehicle.brand} {vehicle.model}
            </h2>
            <p className="text-xs text-steel">{vehicle.plate}{vehicle.vin ? ` · VIN ${vehicle.vin}` : ""}</p>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="rounded-lg p-2 text-steel hover:bg-ash hover:text-navy">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex border-b border-navy/10 px-6">
          <button
            onClick={() => setTab("plan")}
            className={`border-b-2 px-3 py-3 text-sm font-semibold transition ${
              tab === "plan" ? "border-blue text-blue" : "border-transparent text-steel hover:text-navy"
            }`}
          >
            Plan de mantenimiento
          </button>
          <button
            onClick={() => setTab("garantias")}
            className={`border-b-2 px-3 py-3 text-sm font-semibold transition ${
              tab === "garantias" ? "border-blue text-blue" : "border-transparent text-steel hover:text-navy"
            }`}
          >
            Garantías
          </button>
          <button
            onClick={() => setTab("kilometraje")}
            className={`border-b-2 px-3 py-3 text-sm font-semibold transition ${
              tab === "kilometraje" ? "border-blue text-blue" : "border-transparent text-steel hover:text-navy"
            }`}
          >
            Historial de Kilometraje
          </button>
        </div>

        {tab === "plan" ? (
          <div className="flex-1 space-y-5 overflow-y-auto p-6">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">Plan asignado</label>
              <select
                value={status?.plan_id ?? ""}
                onChange={(e) => handleAssign(e.target.value)}
                disabled={assigning || loading}
                className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20 disabled:opacity-60"
              >
                <option value="">Sin plan asignado</option>
                {matchingPlans.length > 0 && (
                  <optgroup label={`Sugeridos para ${vehicle.brand}`}>
                    {matchingPlans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </optgroup>
                )}
                {otherPlans.length > 0 && (
                  <optgroup label="Otras marcas">
                    {otherPlans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.brand} · {p.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            {loading ? (
              <div className="p-10 text-center text-sm text-steel">Cargando estado del plan...</div>
            ) : status?.plan_id && status.entries.length > 0 ? (
              <div>
                <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-steel">
                  Servicios del plan
                  {status.current_mileage != null && ` · ${status.current_mileage.toLocaleString("es-VE")} km actuales`}
                </p>
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-navy/10">
                    <tr className="text-steel">
                      <th className="pb-2 font-mono text-[10px] uppercase tracking-widest">Servicio</th>
                      <th className="pb-2 font-mono text-[10px] uppercase tracking-widest">A los</th>
                      <th className="pb-2 font-mono text-[10px] uppercase tracking-widest">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy/5">
                    {status.entries.map((e) => (
                      <tr key={e.entry_id}>
                        <td className="py-2.5">
                          <span className="font-mono text-blue">{e.tempario_code}</span>{" "}
                          <span className="text-navy">{e.tempario_name}</span>
                        </td>
                        <td className="py-2.5 text-steel">
                          {e.interval_km != null ? `${e.interval_km.toLocaleString("es-VE")} km` : null}
                          {e.interval_km != null && e.interval_months != null ? " · " : null}
                          {e.interval_months != null ? `${e.interval_months} meses` : null}
                        </td>
                        <td className="py-2.5">
                          <span
                            className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest ${STATUS_STYLES[e.status]}`}
                            title={
                              e.status === "cumplido" && e.completed_service_order_code
                                ? `Completado en ${e.completed_service_order_code}`
                                : undefined
                            }
                          >
                            {STATUS_LABELS[e.status]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : status?.plan_id ? (
              <p className="rounded-xl bg-ash px-4 py-6 text-center text-sm text-steel">
                Este plan todavía no tiene servicios definidos.
              </p>
            ) : (
              <p className="rounded-xl bg-ash px-4 py-6 text-center text-sm text-steel">
                Asigna un plan para ver el seguimiento de sus servicios.
              </p>
            )}

            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          </div>
        ) : tab === "garantias" ? (
          <div className="flex-1 space-y-4 overflow-y-auto p-6">
            <p className="text-xs text-steel">
              Solo consulta. Las garantías cuelgan del VIN, así que siguen al vehículo aunque cambie de dueño.
            </p>

            {!vehicle.vin ? (
              <p className="rounded-xl bg-ash px-4 py-6 text-center text-sm text-steel">
                Este vehículo no tiene VIN registrado — no se le puede asociar ninguna garantía.
              </p>
            ) : warrantyLoading ? (
              <div className="p-10 text-center text-sm text-steel">Cargando garantías...</div>
            ) : warrantyError ? (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{warrantyError}</p>
            ) : warranty ? (
              <div className="rounded-xl border border-navy/10 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-blue" />
                    <span className="font-semibold text-navy">Garantía de fábrica</span>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest ${WARRANTY_STATUS_STYLES[warranty.status]}`}>
                    {warranty.status === "vigente" ? "Vigente" : "Vencida"}
                  </span>
                </div>
                <dl className="mt-3 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-steel">Origen</dt>
                    <dd className="text-navy">{WARRANTY_SOURCE_LABELS[warranty.source] ?? warranty.source}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-steel">Paga</dt>
                    <dd className="text-navy">Fabricante</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-steel">Desde</dt>
                    <dd className="text-navy">{new Date(warranty.starts_at).toLocaleDateString("es-VE")}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-steel">Vigencia</dt>
                    <dd className="text-navy">
                      {warranty.expires_at ? `Hasta ${new Date(warranty.expires_at).toLocaleDateString("es-VE")}` : "—"}
                      {warranty.duration_km != null && ` · ${warranty.duration_km.toLocaleString("es-VE")} km`}
                    </dd>
                  </div>
                </dl>
                {warranty.note && <p className="mt-3 text-xs italic text-steel">{warranty.note}</p>}
              </div>
            ) : (
              <p className="rounded-xl bg-ash px-4 py-6 text-center text-sm text-steel">
                Este vehículo no tiene garantía de fábrica registrada.
              </p>
            )}
          </div>
        ) : (
          <div className="flex-1 space-y-4 overflow-y-auto p-6">
            <p className="text-xs text-steel">
              Cada registro proviene de una inspección preliminar — se acumulan, nunca se sobrescriben.
            </p>

            {mileageLoading ? (
              <div className="p-10 text-center text-sm text-steel">Cargando historial...</div>
            ) : mileageHistory.length === 0 ? (
              <p className="rounded-xl bg-ash px-4 py-6 text-center text-sm text-steel">
                Este vehículo aún no tiene lecturas de kilometraje registradas.
              </p>
            ) : (
              <ul className="space-y-2">
                {mileageHistory.map((entry) => (
                  <li
                    key={entry.inspection_id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-navy/10 px-4 py-3"
                  >
                    <div className="flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-steel" />
                      <span className="font-semibold text-navy">
                        {entry.mileage.toLocaleString("es-VE")} km
                      </span>
                    </div>
                    <div className="text-right text-xs text-steel">
                      <p>{new Date(entry.recorded_at).toLocaleDateString("es-VE")}</p>
                      {entry.service_order_id && entry.service_order_code && (
                        <Link
                          href={`/dashboard/servicios/${entry.service_order_id}`}
                          className="font-mono text-blue hover:underline"
                        >
                          {entry.service_order_code}
                        </Link>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="flex items-center justify-end border-t border-navy/10 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-navy/15 px-5 py-2.5 text-sm font-semibold text-navy transition hover:border-navy/40"
          >
            Cerrar
          </button>
          {assigning && <Loader2 className="ml-3 h-4 w-4 animate-spin text-steel" />}
        </div>
      </div>
    </div>
  );
}
