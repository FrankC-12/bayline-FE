"use client";

import { useState } from "react";
import { Plus, Check } from "lucide-react";
import type { Warehouse } from "@/types/warehouse";

interface WarehousePickerProps {
  warehouses: Warehouse[];
  value: string;
  onChange: (id: string) => void;
  onCreate: (name: string) => Promise<Warehouse | undefined>;
  label?: string;
}

export default function WarehousePicker({ warehouses, value, onChange, onCreate, label }: WarehousePickerProps) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate() {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const created = await onCreate(name.trim());
      if (created) onChange(created.id);
      setName("");
      setAdding(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {label && <label className="mb-1.5 block text-sm font-medium text-navy">{label}</label>}
      {warehouses.length === 0 && !adding && (
        <p className="mb-2 text-xs text-steel">Todavía no tenés almacenes creados.</p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {warehouses.map((w) => (
          <button
            key={w.id}
            type="button"
            onClick={() => onChange(w.id)}
            className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
              value === w.id ? "border-blue bg-blue-light text-blue" : "border-navy/15 text-navy"
            }`}
          >
            {w.name}
          </button>
        ))}
        {!adding ? (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 rounded-xl border border-dashed border-navy/20 px-3 py-2.5 text-sm font-semibold text-blue hover:bg-blue-light"
          >
            <Plus className="h-4 w-4" />
            Nuevo almacén
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="Nombre del almacén"
              className="rounded-xl border border-navy/15 px-3 py-2 text-sm outline-none focus:border-blue"
            />
            <button
              type="button"
              onClick={handleCreate}
              disabled={submitting}
              className="rounded-lg bg-blue p-2 text-white transition hover:bg-navy disabled:opacity-50"
              aria-label="Crear almacén"
            >
              <Check className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}