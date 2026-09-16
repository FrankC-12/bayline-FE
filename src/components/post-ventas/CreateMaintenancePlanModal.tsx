"use client";

import { useEffect, useState } from "react";
import { X, Loader2, Plus, Search } from "lucide-react";
import { useTemparios } from "@/hooks/useTemparios";
import { useVehicleCatalog } from "@/hooks/useVehicleCatalog";
import type { CreateMaintenancePlanInput } from "@/lib/api/maintenancePlans";
import type { MaintenancePlan } from "@/types/maintenancePlan";

interface EntryDraft {
  temparioId: string;
  temparioLabel: string;
  search: string;
  intervalKm: string;
  intervalMonths: string;
}

interface CreateMaintenancePlanModalProps {
  open: boolean;
  onClose: () => void;
  filialId: string;
  onSubmit: (input: CreateMaintenancePlanInput) => Promise<void>;
  editingPlan?: MaintenancePlan | null;
}

function emptyEntry(): EntryDraft {
  return { temparioId: "", temparioLabel: "", search: "", intervalKm: "", intervalMonths: "" };
}

interface PlanEntryRowProps {
  filialId: string;
  entry: EntryDraft;
  onChange: (patch: Partial<EntryDraft>) => void;
  onRemove: () => void;
}

function PlanEntryRow({ filialId, entry, onChange, onRemove }: PlanEntryRowProps) {
  const { temparios: results } = useTemparios(filialId, entry.search || undefined);
  const suggestions = entry.search && !entry.temparioId ? results.slice(0, 6) : [];

  return (
    <div className="rounded-lg border border-navy/10 p-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-steel" />
        <input
          value={entry.temparioId ? entry.temparioLabel : entry.search}
          onChange={(e) => onChange({ search: e.target.value, temparioId: "", temparioLabel: "" })}
          placeholder="Buscar tempario — código o nombre..."
          className="w-full rounded-lg border border-navy/15 py-2 pl-8 pr-8 text-sm outline-none focus:border-blue"
        />
        {entry.temparioId && (
          <button
            type="button"
            onClick={() => onChange({ temparioId: "", temparioLabel: "", search: "" })}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-steel hover:text-red-500"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        {suggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full divide-y divide-navy/5 rounded-lg border border-navy/10 bg-white shadow-lg">
            {suggestions.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onChange({ temparioId: t.id, temparioLabel: `${t.code} · ${t.name}`, search: "" })}
                className="block w-full px-3 py-1.5 text-left text-sm hover:bg-ash"
              >
                <span className="font-mono text-blue">{t.code}</span> <span className="text-navy">{t.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min="0"
            value={entry.intervalKm}
            onChange={(e) => onChange({ intervalKm: e.target.value })}
            placeholder="—"
            className="w-24 rounded-lg border border-navy/15 px-2 py-1.5 text-sm outline-none focus:border-blue"
          />
          <span className="text-xs text-steel">km</span>
        </div>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min="0"
            value={entry.intervalMonths}
            onChange={(e) => onChange({ intervalMonths: e.target.value })}
            placeholder="—"
            className="w-20 rounded-lg border border-navy/15 px-2 py-1.5 text-sm outline-none focus:border-blue"
          />
          <span className="text-xs text-steel">meses</span>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="ml-auto rounded-lg border border-navy/15 p-1.5 text-red-500 hover:bg-red-50"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function CreateMaintenancePlanModal({
  open,
  onClose,
  filialId,
  onSubmit,
  editingPlan,
}: CreateMaintenancePlanModalProps) {
  const { brands } = useVehicleCatalog(filialId);
  const [brand, setBrand] = useState("");
  const [name, setName] = useState("");
  const [entries, setEntries] = useState<EntryDraft[]>([emptyEntry()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (editingPlan) {
      setBrand(editingPlan.brand);
      setName(editingPlan.name);
      setEntries(
        editingPlan.entries.length
          ? editingPlan.entries.map((e) => ({
              temparioId: e.tempario_id,
              temparioLabel: `${e.tempario_code} · ${e.tempario_name}`,
              search: "",
              intervalKm: e.interval_km != null ? String(e.interval_km) : "",
              intervalMonths: e.interval_months != null ? String(e.interval_months) : "",
            }))
          : [emptyEntry()]
      );
    } else {
      setBrand("");
      setName("");
      setEntries([emptyEntry()]);
    }
    setError(null);
  }, [open, editingPlan]);

  // Default to the first catalog brand once it loads — only for a new plan;
  // an editingPlan's brand (set above) must never be overridden by this.
  useEffect(() => {
    if (open && !editingPlan && !brand && brands.length > 0) setBrand(brands[0].name);
  }, [open, editingPlan, brand, brands]);

  function updateEntry(index: number, patch: Partial<EntryDraft>) {
    setEntries((prev) => prev.map((e, i) => (i === index ? { ...e, ...patch } : e)));
  }

  function addEntry() {
    setEntries((prev) => [...prev, emptyEntry()]);
  }

  function removeEntry(index: number) {
    setEntries((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  async function handleSubmit() {
    if (!brand) {
      setError("Selecciona una marca.");
      return;
    }
    if (!name.trim()) {
      setError("El nombre del plan es obligatorio.");
      return;
    }
    const validEntries = entries.filter((e) => e.temparioId);
    if (validEntries.length === 0) {
      setError("Agrega al menos un servicio al plan.");
      return;
    }
    for (const e of validEntries) {
      if (!e.intervalKm && !e.intervalMonths) {
        setError(`Define kilómetros o meses para "${e.temparioLabel}".`);
        return;
      }
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        filial_id: filialId,
        brand,
        name: name.trim(),
        entries: validEntries.map((e) => ({
          tempario_id: e.temparioId,
          interval_km: e.intervalKm ? Number(e.intervalKm) : null,
          interval_months: e.intervalMonths ? Number(e.intervalMonths) : null,
        })),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el plan.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-navy/40" />
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-navy/10 px-6 py-4">
          <div>
            <h2 className="font-display text-xl font-bold text-navy">
              {editingPlan ? "Editar Plan de Mantenimiento" : "Nuevo Plan de Mantenimiento"}
            </h2>
            <p className="text-xs text-steel">
              Cada servicio del plan es un tempario del catálogo con su propio kilometraje o plazo
            </p>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="rounded-lg p-2 text-steel hover:bg-ash hover:text-navy">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">Marca</label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
              >
                {brands.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">Nombre del plan</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Plan de mantenimiento programado"
                className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
              />
            </div>
          </div>

          <div>
            <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-blue">Servicios del plan</p>
            <div className="space-y-3 rounded-xl border border-navy/10 p-3">
              {entries.map((entry, i) => (
                <PlanEntryRow
                  key={i}
                  filialId={filialId}
                  entry={entry}
                  onChange={(patch) => updateEntry(i, patch)}
                  onRemove={() => removeEntry(i)}
                />
              ))}
              <button
                type="button"
                onClick={addEntry}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-navy/20 py-2 text-sm font-semibold text-blue hover:bg-blue-light"
              >
                <Plus className="h-4 w-4" />
                Agregar servicio
              </button>
            </div>
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-navy/10 px-6 py-4">
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
            disabled={submitting}
            className="flex items-center justify-center gap-2 rounded-full bg-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Guardar plan
          </button>
        </div>
      </div>
    </div>
  );
}
