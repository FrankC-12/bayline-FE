"use client";

import { useMemo, useState } from "react";
import { X, Loader2, Search } from "lucide-react";
import { useVehicleLookup } from "@/hooks/useVehicleLookUp";
import type { Bay } from "@/types/serviceOrder";
import type { AppUser } from "@/types/user";
import type { CreateServiceOrderInput } from "@/lib/api/serviceOrders";

interface ScheduleOrderModalProps {
  open: boolean;
  onClose: () => void;
  filialId: string;
  defaultDate: string;
  hours: number[];
  bays: Bay[];
  technicians: AppUser[];
  onSubmit: (input: CreateServiceOrderInput) => Promise<void>;
}

export default function ScheduleOrderModal({
  open,
  onClose,
  filialId,
  defaultDate,
  hours,
  bays,
  technicians,
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
    if (!selectedVehicleId || !date || !time) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        filial_id: filialId,
        vehicle_id: selectedVehicleId,
        scheduled_at: new Date(`${date}T${time}`).toISOString(),
        bay_id: bayId || null,
        technician_user_id: technicianId || null,
        notes: notes || null,
      });
      setSearch("");
      setSelectedVehicleId(null);
      setTime("");
      setBayId("");
      setTechnicianId("");
      setNotes("");
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
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
              >
                <option value="">Selecciona...</option>
                {hours.map((h) => (
                  <optgroup key={h} label={`${h.toString().padStart(2, "0")}:00`}>
                    {["00", "30"].map((m) => {
                      const value = `${h.toString().padStart(2, "0")}:${m}`;
                      return (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      );
                    })}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

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
            disabled={!selectedVehicleId || !date || !time || submitting}
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