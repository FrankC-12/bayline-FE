"use client";

import { X } from "lucide-react";
import { formatThousands, stripThousands } from "@/lib/format";
import type { VehicleFormValue } from "@/types/client-form";

const BODY_TYPES = ["Sedán", "Pick-up", "SUV", "Camión", "Van", "Moto", "Otro"];
const FUEL_TYPES = [
  { value: "gasolina", label: "Gasolina" },
  { value: "diesel", label: "Diésel" },
  { value: "hibrido", label: "Híbrido" },
  { value: "electrico", label: "Eléctrico" },
];
const TRANSMISSION_TYPES = [
  { value: "manual", label: "Manual" },
  { value: "automatica", label: "Automática" },
];
const UPHOLSTERY_TYPES = [
  { value: "tela", label: "Tela" },
  { value: "cuero", label: "Cuero" },
  { value: "semicuero", label: "Semicuero" },
  { value: "cuero_sintetico", label: "Cuero sintético (ecocuero)" },
  { value: "alcantara", label: "Alcántara" },
  { value: "vinil", label: "Vinil" },
  { value: "combinada", label: "Combinada (tela y cuero)" },
  { value: "nailon", label: "Nailon reforzado" },
];

interface VehicleFieldsProps {
  index: number;
  value: VehicleFormValue;
  onChange: (index: number, patch: Partial<VehicleFormValue>) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

export default function VehicleFields({ index, value, onChange, onRemove, canRemove }: VehicleFieldsProps) {
  const vinLength = value.vin.length;
  const vinInvalid = vinLength > 0 && vinLength !== 17;
  const plateLength = value.plate.length;
  const plateInvalid = plateLength > 0 && plateLength !== 8;

  return (
    <div className="rounded-2xl border border-dashed border-navy/20 bg-ash/50 p-6">
      <div className="mb-4 flex items-center justify-between">
        <span className="font-display text-sm font-bold text-navy">Vehículo {index + 1}</span>
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700"
          >
            <X className="h-3.5 w-3.5" />
            Quitar
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-navy">Marca</label>
          <input
            value={value.brand}
            onChange={(e) => onChange(index, { brand: e.target.value })}
            placeholder="Ej: Toyota"
            className="w-full rounded-lg border border-navy/15 px-3 py-2 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-navy">Modelo</label>
          <input
            value={value.model}
            onChange={(e) => onChange(index, { model: e.target.value })}
            placeholder="Ej: Hilux"
            className="w-full rounded-lg border border-navy/15 px-3 py-2 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-navy">Año</label>
          <input
            type="number"
            min={1980}
            max={2100}
            value={value.year}
            onChange={(e) => onChange(index, { year: e.target.value })}
            placeholder="2024"
            className="w-full rounded-lg border border-navy/15 px-3 py-2 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
          />
        </div>

        <div>
          <label className="mb-1 flex items-center justify-between text-xs font-medium text-navy">
            VIN
            <span className={vinInvalid ? "text-red-600" : "text-steel"}>{vinLength}/17</span>
          </label>
          <input
            value={value.vin}
            onChange={(e) => onChange(index, { vin: e.target.value.toUpperCase().slice(0, 17) })}
            placeholder="8AJHA3CD1K0000000"
            className={`w-full rounded-lg border px-3 py-2 font-mono text-sm uppercase outline-none focus:ring-2 ${
              vinInvalid
                ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                : "border-navy/15 focus:border-blue focus:ring-blue/20"
            }`}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-navy">Último kilometraje</label>
          <input
            inputMode="numeric"
            value={formatThousands(value.mileage)}
            onChange={(e) => onChange(index, { mileage: stripThousands(e.target.value) })}
            placeholder="0"
            className="w-full rounded-lg border border-navy/15 px-3 py-2 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-navy">Fecha de compra</label>
          <input
            type="date"
            value={value.purchaseDate}
            onChange={(e) => onChange(index, { purchaseDate: e.target.value })}
            className="w-full rounded-lg border border-navy/15 px-3 py-2 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-navy">Tipo</label>
          <select
            value={value.bodyType}
            onChange={(e) => onChange(index, { bodyType: e.target.value })}
            className="w-full rounded-lg border border-navy/15 px-3 py-2 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
          >
            <option value="">Selecciona</option>
            {BODY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 flex items-center justify-between text-xs font-medium text-navy">
            Placa
            <span className={plateInvalid ? "text-red-600" : "text-steel"}>{plateLength}/8</span>
          </label>
          <input
            value={value.plate}
            onChange={(e) => onChange(index, { plate: e.target.value.toUpperCase().slice(0, 8) })}
            placeholder="ABC-1234"
            className={`w-full rounded-lg border px-3 py-2 font-mono text-sm uppercase outline-none focus:ring-2 ${
              plateInvalid
                ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                : "border-navy/15 focus:border-blue focus:ring-blue/20"
            }`}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-navy">Color</label>
          <input
            value={value.color}
            onChange={(e) => onChange(index, { color: e.target.value })}
            placeholder="Plata"
            className="w-full rounded-lg border border-navy/15 px-3 py-2 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-navy">Tapicería</label>
          <select
            value={value.upholstery}
            onChange={(e) => onChange(index, { upholstery: e.target.value })}
            className="w-full rounded-lg border border-navy/15 px-3 py-2 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
          >
            <option value="">Selecciona</option>
            {UPHOLSTERY_TYPES.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-navy">Combustible</label>
          <select
            value={value.fuelType}
            onChange={(e) => onChange(index, { fuelType: e.target.value })}
            className="w-full rounded-lg border border-navy/15 px-3 py-2 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
          >
            <option value="">Selecciona</option>
            {FUEL_TYPES.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-navy">Transmisión</label>
          <select
            value={value.transmission}
            onChange={(e) => onChange(index, { transmission: e.target.value })}
            className="w-full rounded-lg border border-navy/15 px-3 py-2 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
          >
            <option value="">Selecciona</option>
            {TRANSMISSION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}