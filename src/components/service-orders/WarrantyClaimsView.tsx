"use client";

import { useEffect, useState } from "react";
import { Search, ShieldCheck, AlertTriangle, Loader2, User, Car } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useClients } from "@/hooks/useClients";
import {
  listWarrantyClaims,
  getVehicleWarrantiesForClaim,
  createWarrantyClaim,
} from "@/lib/api/warrantyClaims";
import type { VehicleWarranty } from "@/types/vehicleWarranty";
import type { WarrantyClaim } from "@/types/warrantyClaim";
import type { Client, Vehicle } from "@/types/client";
import EmptyState from "@/components/common/EmptyState";

interface SelectedVehicle {
  vehicle: Vehicle;
  client: Client;
}

export default function WarrantyClaimsView() {
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;

  const [search, setSearch] = useState("");
  const { clients: searchResults, loading: searching } = useClients(filialId, search.trim() || undefined);

  const [selected, setSelected] = useState<SelectedVehicle | null>(null);
  const [warranties, setWarranties] = useState<VehicleWarranty[]>([]);
  const [warrantiesLoading, setWarrantiesLoading] = useState(false);
  const [selectedWarrantyIds, setSelectedWarrantyIds] = useState<string[]>([]);
  const [reportedSymptom, setReportedSymptom] = useState("");
  const [reportedMileage, setReportedMileage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [claims, setClaims] = useState<WarrantyClaim[]>([]);
  const [claimsLoading, setClaimsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!filialId) {
      setClaimsLoading(false);
      return;
    }
    listWarrantyClaims(filialId)
      .then((data) => {
        if (active) setClaims(data);
      })
      .finally(() => {
        if (active) setClaimsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [filialId]);

  function pickVehicle(client: Client, vehicle: Vehicle) {
    setSelected({ client, vehicle });
    setSearch("");
    setSelectedWarrantyIds([]);
    setReportedSymptom("");
    setReportedMileage("");
    setError(null);
    setWarrantiesLoading(true);
    getVehicleWarrantiesForClaim(vehicle.id)
      .then(setWarranties)
      .finally(() => setWarrantiesLoading(false));
  }

  function toggleWarranty(id: string) {
    setSelectedWarrantyIds((prev) => (prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]));
  }

  const reportedMileageNum = reportedMileage.trim() === "" ? null : Number(reportedMileage);
  const currentMileage = selected?.vehicle.current_mileage ?? null;
  const mileageInconsistent =
    reportedMileageNum != null && currentMileage != null && reportedMileageNum < currentMileage;

  async function handleSubmit() {
    if (!selected) {
      setError("Busca y selecciona un vehículo.");
      return;
    }
    if (selectedWarrantyIds.length === 0) {
      setError("Selecciona al menos una garantía vigente que aplique.");
      return;
    }
    if (reportedSymptom.trim().length < 3) {
      setError("Describe el síntoma que reporta el cliente (mínimo 3 caracteres).");
      return;
    }
    if (reportedMileageNum == null || reportedMileageNum < 0) {
      setError("Indica el kilometraje que reporta el cliente.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const created = await createWarrantyClaim({
        vehicle_id: selected.vehicle.id,
        warranty_ids: selectedWarrantyIds,
        reported_symptom: reportedSymptom.trim(),
        reported_mileage: reportedMileageNum,
      });
      setClaims((prev) => [created, ...prev]);
      setSelected(null);
      setWarranties([]);
      setSelectedWarrantyIds([]);
      setReportedSymptom("");
      setReportedMileage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar el reclamo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="mb-2 font-display text-3xl font-bold text-navy">Garantías</h1>
      <p className="mb-6 text-sm text-steel">
        Levanta un reclamo de garantía cuando el cliente vuelve por algo que falló · queda solicitado, sin abrir
        orden — un superior lo autoriza después.
      </p>

      <div className="rounded-2xl border border-navy/10 bg-white p-6">
        <p className="font-display text-lg font-bold text-navy">Nuevo reclamo de garantía</p>

        {!selected ? (
          <div className="mt-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por placa, VIN o nombre del cliente..."
                className="w-full rounded-full border border-navy/15 py-3 pl-11 pr-4 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
              />
            </div>

            {search.trim().length > 0 && (
              <div className="mt-3 max-h-72 overflow-y-auto rounded-xl border border-navy/10">
                {searching ? (
                  <p className="p-4 text-sm text-steel">Buscando...</p>
                ) : searchResults.length === 0 ? (
                  <p className="p-4 text-sm italic text-steel">Sin resultados.</p>
                ) : (
                  searchResults.flatMap((client) =>
                    client.vehicles.map((vehicle) => (
                      <button
                        key={vehicle.id}
                        onClick={() => pickVehicle(client, vehicle)}
                        className="flex w-full items-center justify-between gap-3 border-b border-navy/5 px-4 py-3 text-left text-sm last:border-0 hover:bg-ash"
                      >
                        <div>
                          <p className="font-semibold text-navy">
                            {vehicle.plate} · {vehicle.brand} {vehicle.model}
                          </p>
                          <p className="text-xs text-steel">
                            {client.full_name}
                            {vehicle.vin && ` · ${vehicle.vin}`}
                          </p>
                        </div>
                        {vehicle.current_mileage != null && (
                          <span className="shrink-0 text-xs text-steel">
                            {vehicle.current_mileage.toLocaleString("es-VE")} km
                          </span>
                        )}
                      </button>
                    ))
                  )
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 space-y-5">
            <div className="flex items-start justify-between gap-3 rounded-xl bg-ash p-4">
              <div className="flex items-start gap-2">
                <Car className="mt-0.5 h-4 w-4 text-blue" />
                <div>
                  <p className="font-semibold text-navy">
                    {selected.vehicle.plate} · {selected.vehicle.brand} {selected.vehicle.model}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-steel">
                    <User className="h-3 w-3" /> {selected.client.full_name}
                    {selected.vehicle.vin && ` · ${selected.vehicle.vin}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="shrink-0 text-xs font-semibold text-blue hover:text-navy"
              >
                Cambiar vehículo
              </button>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">
                Garantías vigentes — selecciona cuáles aplican
              </label>
              {warrantiesLoading ? (
                <p className="text-sm text-steel">Cargando garantías...</p>
              ) : warranties.length === 0 ? (
                <p className="rounded-xl bg-ash px-4 py-4 text-sm italic text-steel">
                  Este vehículo no tiene garantías de fábrica vigentes.
                </p>
              ) : (
                <div className="space-y-2">
                  {warranties.map((w) => (
                    <label
                      key={w.id}
                      className="flex cursor-pointer items-start gap-3 rounded-xl border border-navy/10 p-3 hover:border-blue"
                    >
                      <input
                        type="checkbox"
                        checked={selectedWarrantyIds.includes(w.id)}
                        onChange={() => toggleWarranty(w.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 text-sm">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-emerald-600" />
                          <span className="font-semibold text-navy">
                            {w.brand} {w.model ?? ""}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-steel">
                          {w.expires_at
                            ? `Vence ${new Date(w.expires_at).toLocaleDateString("es-VE")}`
                            : "Sin vencimiento por fecha"}
                          {w.days_remaining != null && ` · ${w.days_remaining} días restantes`}
                          {w.duration_km != null && ` · límite ${w.duration_km.toLocaleString("es-VE")} km`}
                          {w.km_remaining != null && ` · ${w.km_remaining.toLocaleString("es-VE")} km restantes`}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">Síntoma que reporta el cliente</label>
              <textarea
                value={reportedSymptom}
                onChange={(e) => setReportedSymptom(e.target.value)}
                rows={3}
                placeholder="Ej: ruido metálico al frenar desde ayer"
                className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">Kilometraje reportado por el cliente</label>
              <input
                type="number"
                min="0"
                value={reportedMileage}
                onChange={(e) => setReportedMileage(e.target.value)}
                className="w-40 rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
              />
              {currentMileage != null && (
                <p className="mt-1.5 text-xs text-steel">Último kilometraje registrado: {currentMileage.toLocaleString("es-VE")} km</p>
              )}
              {mileageInconsistent && (
                <div className="mt-2 flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>
                    El kilometraje reportado es menor al último registrado ({currentMileage?.toLocaleString("es-VE")} km) — dato
                    inconsistente. Se puede registrar igual; queda marcado para revisión.
                  </p>
                </div>
              )}
            </div>

            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Registrar reclamo
            </button>
          </div>
        )}
      </div>

      <div className="mt-8 rounded-2xl border border-navy/10 bg-white p-6">
        <p className="font-display text-lg font-bold text-navy">Reclamos recientes</p>
        <p className="mt-1 text-sm text-steel">Solicitados, a la espera de autorización</p>

        <div className="mt-4">
          {claimsLoading ? (
            <p className="text-sm text-steel">Cargando reclamos...</p>
          ) : claims.length === 0 ? (
            <EmptyState compact title="No hay reclamos de garantía registrados." />
          ) : (
            <div className="space-y-3">
              {claims.map((c) => (
                <div key={c.id} className="rounded-xl border border-navy/10 p-4 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-navy">
                        {c.vehicle_plate} · {c.client_name}
                      </p>
                      <p className="mt-1 text-steel">{c.reported_symptom}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-amber-700">
                      Solicitado
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-steel">
                    <span>{new Date(c.created_at).toLocaleDateString("es-VE")}</span>
                    <span>·</span>
                    <span>{c.reported_mileage.toLocaleString("es-VE")} km reportados</span>
                    {c.mileage_inconsistent && (
                      <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 font-semibold text-red-700">
                        <AlertTriangle className="h-3 w-3" />
                        Kilometraje inconsistente
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
