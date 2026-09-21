"use client";

import { useState } from "react";
import { Plus, Search, Upload, X, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useVehicleWarranties } from "@/hooks/useVehicleWarranties";
import { useVehicleCatalog } from "@/hooks/useVehicleCatalog";
import type { VehicleWarrantyStatus } from "@/types/vehicleWarranty";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import BrandModelSelect from "@/components/common/BrandModelSelect";
import BulkImportWarrantiesModal from "./BulkImportWarrantiesModal";

const STATUS_STYLES: Record<VehicleWarrantyStatus, string> = {
  vigente: "bg-emerald-100 text-emerald-700",
  vencida: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<VehicleWarrantyStatus, string> = {
  vigente: "Vigente",
  vencida: "Vencida",
};

const SOURCE_LABELS: Record<string, string> = {
  venta: "Venta",
  manual: "Manual",
};

export default function VehicleWarrantiesView() {
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;

  const [search, setSearch] = useState("");
  const { warranties, loading, error, addWarranty, importBulk, refresh } = useVehicleWarranties(filialId, search || undefined);
  const [createOpen, setCreateOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold text-navy">Garantías de Fábrica</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setBulkOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-navy/15 px-5 py-2.5 text-sm font-semibold text-navy transition hover:border-blue hover:text-blue"
          >
            <Upload className="h-4 w-4" />
            Carga masiva
          </button>
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy"
          >
            <Plus className="h-4 w-4" />
            Registrar por VIN
          </button>
        </div>
      </div>
      <p className="mb-4 text-sm text-steel">
        Se crean solas al vender un vehículo nuevo en el Concesionario. Regístralas a mano por VIN para vehículos de otras marcas que no vendimos aquí.
      </p>

      <div className="relative mb-4 max-w-md">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por VIN o marca..."
          className="w-full rounded-full border border-navy/15 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
        {loading ? (
          <div className="p-12 text-center text-sm text-steel">Cargando garantías...</div>
        ) : error ? (
          <ErrorState error={error} onRetry={refresh} compact />
        ) : warranties.length === 0 ? (
          <EmptyState compact title={search ? "Sin resultados." : "No hay garantías registradas todavía."} />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-navy/10 bg-ash">
              <tr>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">VIN</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Vehículo</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Inicio</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Cobertura</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Origen</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {warranties.map((w) => (
                <tr key={w.id} className="transition hover:bg-ash/60">
                  <td className="px-6 py-4 font-mono text-blue">{w.vin}</td>
                  <td className="px-6 py-4 font-medium text-navy">{w.brand}{w.model ? ` ${w.model}` : ""}</td>
                  <td className="px-6 py-4 text-steel">{new Date(w.starts_at).toLocaleDateString("es-VE")}</td>
                  <td className="px-6 py-4 text-steel">
                    {w.duration_months != null ? `${w.duration_months} meses` : null}
                    {w.duration_months != null && w.duration_km != null ? " · " : null}
                    {w.duration_km != null ? `${w.duration_km.toLocaleString("es-VE")} km` : null}
                  </td>
                  <td className="px-6 py-4 text-steel">{SOURCE_LABELS[w.source]}</td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[w.status]}`}>
                      {STATUS_LABELS[w.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {filialId && (
        <CreateWarrantyModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          filialId={filialId}
          onSubmit={addWarranty}
        />
      )}
      <BulkImportWarrantiesModal open={bulkOpen} onClose={() => setBulkOpen(false)} onImport={importBulk} />
    </div>
  );
}

function CreateWarrantyModal({
  open,
  onClose,
  filialId,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  filialId: string;
  onSubmit: (input: {
    vin: string;
    brand: string;
    model?: string | null;
    starts_at: string;
    duration_months?: number | null;
    duration_km?: number | null;
    note?: string | null;
  }) => Promise<unknown>;
}) {
  const { brands } = useVehicleCatalog(filialId);
  const [vin, setVin] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [startsAt, setStartsAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [durationMonths, setDurationMonths] = useState("");
  const [durationKm, setDurationKm] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (vin.trim().length !== 17) {
      setError("El VIN debe tener exactamente 17 caracteres.");
      return;
    }
    if (!brand.trim()) {
      setError("La marca es obligatoria.");
      return;
    }
    if (!durationMonths && !durationKm) {
      setError("Define la duración en meses o en kilómetros.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        vin: vin.trim().toUpperCase(),
        brand: brand.trim(),
        model: model.trim() || null,
        starts_at: startsAt,
        duration_months: durationMonths ? Number(durationMonths) : null,
        duration_km: durationKm ? Number(durationKm) : null,
        note: note.trim() || null,
      });
      setVin(""); setBrand(""); setModel(""); setDurationMonths(""); setDurationKm(""); setNote("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar la garantía.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-navy/40" />
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-navy/10 px-6 py-4">
          <h2 className="font-display text-lg font-bold text-navy">Registrar garantía por VIN</h2>
          <button onClick={onClose} aria-label="Cerrar" className="rounded-lg p-2 text-steel hover:bg-ash hover:text-navy">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">VIN (17 caracteres)</label>
            <input
              value={vin}
              onChange={(e) => setVin(e.target.value.toUpperCase().slice(0, 17))}
              placeholder="1HGCM82633A004352"
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 font-mono text-sm outline-none focus:border-blue"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <BrandModelSelect
              brands={brands}
              brand={brand}
              model={model}
              onBrandChange={setBrand}
              onModelChange={setModel}
              modelRequired={false}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Fecha de inicio</label>
            <input type="date" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">Meses de cobertura</label>
              <input type="number" min="0" value={durationMonths} onChange={(e) => setDurationMonths(e.target.value)} className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">Kilómetros de cobertura</label>
              <input type="number" min="0" value={durationKm} onChange={(e) => setDurationKm(e.target.value)} className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue" />
            </div>
          </div>
          <p className="text-xs text-steel">Define al menos una de las dos.</p>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Nota (opcional)</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue" />
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Registrar garantía
          </button>
        </div>
      </div>
    </div>
  );
}
