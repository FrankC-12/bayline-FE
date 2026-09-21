"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Loader2, Search } from "lucide-react";
import { useVehicleLookup } from "@/hooks/useVehicleLookUp";
import { useInspections } from "@/hooks/useInspections";
import { useUserDirectory } from "@/hooks/useUserDirectory";
import { useRoleDirectory } from "@/hooks/useRoleDirectory";

export interface CreateOrderExtra {
  customer_reason: string;
  advisor_user_id: string;
  promised_at: string;
}

interface CreateOrderPanelProps {
  open: boolean;
  onClose: () => void;
  filialId: string;
  onSubmit: (
    vehicleId: string,
    orderType: "regular" | "mpt",
    extra: CreateOrderExtra,
    inspectionId: string
  ) => Promise<void>;
}

export default function CreateOrderPanel({ open, onClose, filialId, onSubmit }: CreateOrderPanelProps) {
  const { clients } = useVehicleLookup(filialId);
  const { inspections: unlinkedInspections } = useInspections(filialId, true);
  const { users } = useUserDirectory({ filialId });
  const { roles } = useRoleDirectory("filial");
  const advisorRoleId = roles.find((r) => r.slug === "asesor")?.id;
  const advisors = users.filter((u) => u.role_id === advisorRoleId);

  const [search, setSearch] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [orderType, setOrderType] = useState<"regular" | "mpt">("regular");
  const [customerReason, setCustomerReason] = useState("");
  const [advisorUserId, setAdvisorUserId] = useState("");
  const [promisedAt, setPromisedAt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const results = useMemo(() => {
    if (!search || selectedVehicleId) return [];
    const term = search.toLowerCase();
    const entries: { vehicleId: string; label: string; sub: string }[] = [];
    for (const client of clients) {
      for (const vehicle of client.vehicles) {
        const matches =
          (vehicle.plate ?? "").toLowerCase().includes(term) ||
          (vehicle.vin ?? "").toLowerCase().includes(term) ||
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
    if (!selectedVehicleId) return null;
    const candidates = unlinkedInspections
      .filter((i) => i.vehicle_id === selectedVehicleId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return candidates[0] ?? null;
  }, [unlinkedInspections, selectedVehicleId]);

  useEffect(() => {
    if (matchedInspection) {
      setCustomerReason(matchedInspection.notes ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchedInspection?.id]);

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
    if (!promisedAt) {
      setError("Selecciona la fecha prometida de entrega.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(
        selectedVehicleId,
        orderType,
        {
          customer_reason: customerReason.trim(),
          advisor_user_id: advisorUserId,
          promised_at: promisedAt,
        },
        matchedInspection.id
      );
      setSearch("");
      setSelectedVehicleId(null);
      setCustomerReason("");
      setAdvisorUserId("");
      setPromisedAt("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la ODS.");
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
        className={`absolute inset-y-0 right-0 flex w-full max-w-lg flex-col overflow-y-auto bg-white shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-navy/10 px-8 py-5">
          <h2 className="font-display text-xl font-bold text-navy">Nueva ODS</h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-lg p-2 text-steel hover:bg-ash hover:text-navy"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 p-8">
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
                placeholder="Buscar por placa, VIN o cliente..."
                className="w-full rounded-xl border border-navy/15 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
              />
            </div>
            {results.length > 0 && (
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

          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Tipo de orden</label>
            {/* "mpt" (Garantías) stays hidden here on purpose — there is no
                Garantías/MPT module or screen behind it yet (/dashboard/mpt
                and /dashboard/garantias both 404). Re-add the option once
                that module exists; existing orders can still hold "mpt" via
                the API/DB, this only stops new ones from being created with
                no workflow behind them. */}
            <select
              value={orderType}
              onChange={(e) => setOrderType(e.target.value as "regular" | "mpt")}
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
            >
              <option value="regular">Regular</option>
            </select>
          </div>

          {selectedVehicleId && matchedInspection ? (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              Kilometraje y motivo heredados de la Inspección Preliminar del{" "}
              {new Date(matchedInspection.created_at).toLocaleDateString("es-VE")} — el motivo puedes editarlo.
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
              <label className="mb-1.5 block text-sm font-medium text-navy">Fecha prometida de entrega</label>
              <input
                type="date"
                value={promisedAt}
                onChange={(e) => setPromisedAt(e.target.value)}
                className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
              />
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
            disabled={!selectedVehicleId || !matchedInspection || submitting}
            className="flex items-center justify-center gap-2 rounded-full bg-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Crear ODS
          </button>
        </div>
      </aside>
    </div>
  );
}
