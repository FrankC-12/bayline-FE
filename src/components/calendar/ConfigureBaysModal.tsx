"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";
import type { Bay } from "@/types/serviceOrder";

interface ConfigureBaysModalProps {
  open: boolean;
  onClose: () => void;
  bays: Bay[];
  onToggle: (bay: Bay) => void;
  onAdd: (name: string) => Promise<void>;
}

export default function ConfigureBaysModal({ open, onClose, bays, onToggle, onAdd }: ConfigureBaysModalProps) {
  const [newBayName, setNewBayName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleAdd() {
    if (!newBayName.trim()) return;
    setSubmitting(true);
    try {
      await onAdd(newBayName.trim());
      setNewBayName("");
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
          <h2 className="font-display text-lg font-bold text-navy">Configuración de bahías</h2>
          <button onClick={onClose} aria-label="Cerrar" className="rounded-lg p-2 text-steel hover:bg-ash hover:text-navy">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 p-6">
          {bays.map((bay) => (
            <div key={bay.id} className="flex items-center justify-between rounded-xl border border-navy/10 px-4 py-3">
              <span className="font-medium text-navy">{bay.name}</span>
              <button
                onClick={() => onToggle(bay)}
                className={`relative h-6 w-11 rounded-full transition ${bay.is_active ? "bg-emerald-500" : "bg-navy/15"}`}
                aria-label={bay.is_active ? "Desactivar" : "Activar"}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                    bay.is_active ? "left-5" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          ))}

          <div className="flex gap-2 border-2 border-dashed border-navy/15 rounded-xl p-2">
            <input
              value={newBayName}
              onChange={(e) => setNewBayName(e.target.value)}
              placeholder="Nombre de la bahía"
              className="flex-1 rounded-lg px-2 py-1.5 text-sm outline-none"
            />
            <button
              onClick={handleAdd}
              disabled={submitting || !newBayName.trim()}
              className="flex items-center gap-1 rounded-lg bg-blue px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Agregar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}