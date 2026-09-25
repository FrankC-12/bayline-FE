"use client";

import type { ReactNode } from "react";
import { Pencil, X } from "lucide-react";
import type { Part } from "@/types/parts";

interface PartDetailPanelProps {
  open: boolean;
  part: Part | null;
  onClose: () => void;
  onEdit: (part: Part) => void;
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="mb-1 font-mono text-[11px] uppercase tracking-widest text-steel">{label}</p>
      <p className="text-sm font-medium text-navy">{value}</p>
    </div>
  );
}

function compatibilityValue(part: Part): string {
  if (!part.vehicle_brand_name) return "Universal";
  const vehicle = [part.vehicle_brand_name, part.vehicle_model_name].filter(Boolean).join(" ");
  const years =
    part.year_from || part.year_to ? ` · ${part.year_from ?? "…"}-${part.year_to ?? "…"}` : "";
  return `${vehicle}${years}`;
}

export default function PartDetailPanel({ open, part, onClose, onEdit }: PartDetailPanelProps) {
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
        className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col overflow-y-auto bg-white shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-navy/10 px-8 py-5">
          <h2 className="font-display text-xl font-bold text-navy">Detalle del repuesto</h2>
          <div className="flex items-center gap-1">
            {part && (
              <button
                onClick={() => onEdit(part)}
                aria-label="Editar repuesto"
                className="rounded-lg p-2 text-blue transition hover:bg-blue-light"
              >
                <Pencil className="h-5 w-5" />
              </button>
            )}
            <button onClick={onClose} aria-label="Cerrar" className="rounded-lg p-2 text-steel hover:bg-ash hover:text-navy">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {part && (
          <div className="flex-1 space-y-5 p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-lg font-bold text-blue">{part.code}</p>
                <p className="font-display text-lg font-bold text-navy">{part.name}</p>
              </div>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest ${
                  part.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                }`}
              >
                {part.is_active ? "Activo" : "Inactivo"}
              </span>
            </div>

            <Field label="Número de parte del fabricante" value={part.manufacturer_part_number ?? "—"} />
            <Field label="Categoría" value={part.category_name} />
            <Field label="Compatibilidad" value={compatibilityValue(part)} />

            <div className="grid grid-cols-2 gap-4">
              <Field label="Unidad" value={part.unit} />
              <Field label="Stock mínimo" value={part.min_stock} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Stock total" value={part.stock_total} />
              <Field label="Ubicación" value={part.location ?? "—"} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Precio de referencia"
                value={part.reference_price === null ? "Sin costo registrado" : `$${part.reference_price.toFixed(2)}`}
              />
              <Field
                label="Costo más reciente"
                value={part.latest_cost === null ? "—" : `$${part.latest_cost.toFixed(2)}`}
              />
            </div>

            <p className="text-xs text-steel">
              El stock, el precio de referencia y la ubicación en almacén se calculan automáticamente desde
              los lotes de almacén y no se editan aquí.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
