"use client";

import { useMemo, useState } from "react";
import { X, Loader2, Search } from "lucide-react";
import { useVehicleLookup } from "@/hooks/useVehicleLookUp";
import { formatThousands, stripThousands } from "@/lib/format";
import type { CreateInspectionInput } from "@/lib/api/inspections";

interface CreateInspectionPanelProps {
  open: boolean;
  onClose: () => void;
  filialId: string;
  onSubmit: (input: CreateInspectionInput) => Promise<unknown>;
}

export default function CreateInspectionPanel({
  open,
  onClose,
  filialId,
  onSubmit,
}: CreateInspectionPanelProps) {
  const { clients } = useVehicleLookup(filialId);
  const [search, setSearch] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [mileage, setMileage] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"en_proceso" | "completada">("completada");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const results = useMemo(() => {
    if (!search || selectedVehicleId) return [];
    const term = search.toLowerCase();
    const entries: { vehicleId: string; label: string; sub: string }[] = [];
    for (const client of clients) {
      for (const vehicle of client.vehicles) {
        const matches =
          vehicle.plate.toLowerCase().includes(term) ||
          (vehicle.vin ?? "").toLowerCase().includes(term) ||
          client.full_name.toLowerCase().includes(term);
        if (matches) {
          entries.push({
            vehicleId: vehicle.id,
            label: `${vehicle.brand} ${vehicle.model} · ${vehicle.plate}`,
            sub: client.full_name,
          });
        }
      }
    }
    return entries.slice(0, 8);
  }, [search, clients, selectedVehicleId]);

  async function handleSubmit() {
    if (!selectedVehicleId) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        filial_id: filialId,
        vehicle_id: selectedVehicleId,
        mileage: mileage ? Number(stripThousands(mileage)) : null,
        notes: notes || null,
        status,
      });
      setSearch("");
      setSelectedVehicleId(null);
      setMileage("");
      setNotes("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la inspección.");
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
          <h2 className="font-display text-xl font-bold text-navy">Nueva Inspección</h2>
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
            <label className="mb-1.5 block text-sm font-medium text-navy">Vehículo</label>
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

          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Kilometraje de ingreso</label>
            <input
              inputMode="numeric"
              value={formatThousands(mileage)}
              onChange={(e) => setMileage(stripThousands(e.target.value))}
              placeholder="0"
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Notas</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Ingreso por mantenimiento. Sin observaciones de carrocería..."
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Estado</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "en_proceso" | "completada")}
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
            >
              <option value="completada">Completada</option>
              <option value="en_proceso">En proceso</option>
            </select>
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
            disabled={!selectedVehicleId || submitting}
            className="flex items-center justify-center gap-2 rounded-full bg-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Crear inspección
          </button>
        </div>
      </aside>
    </div>
  );
}