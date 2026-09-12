"use client";

import { useState } from "react";
import { X, Plus, Pencil, Check } from "lucide-react";
import type { Bay } from "@/types/serviceOrder";

interface ConfigureBaysModalProps {
  open: boolean;
  onClose: () => void;
  bays: Bay[];
  onToggle: (bay: Bay) => void;
  onAdd: (name: string) => Promise<void>;
  onRename: (bay: Bay, name: string) => Promise<unknown>;
}

export default function ConfigureBaysModal({ open, onClose, bays, onToggle, onAdd, onRename }: ConfigureBaysModalProps) {
  const [newBayName, setNewBayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [renaming, setRenaming] = useState(false);

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

  function startEditing(bay: Bay) {
    setEditingId(bay.id);
    setEditingName(bay.name);
  }

  async function handleRename(bay: Bay) {
    const trimmed = editingName.trim();
    if (!trimmed || trimmed === bay.name) {
      setEditingId(null);
      return;
    }
    setRenaming(true);
    try {
      await onRename(bay, trimmed);
      setEditingId(null);
    } finally {
      setRenaming(false);
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
            <div key={bay.id} className="flex items-center justify-between gap-2 rounded-xl border border-navy/10 px-4 py-3">
              {editingId === bay.id ? (
                <div className="flex flex-1 items-center gap-2">
                  <input
                    autoFocus
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename(bay);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    disabled={renaming}
                    className="flex-1 rounded-lg border border-navy/15 px-2 py-1 text-sm outline-none focus:border-blue disabled:opacity-60"
                  />
                  <button
                    onClick={() => handleRename(bay)}
                    disabled={renaming || !editingName.trim()}
                    aria-label="Guardar nombre"
                    className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => startEditing(bay)}
                  className="flex flex-1 items-center gap-2 text-left font-medium text-navy hover:text-blue"
                >
                  {bay.name}
                  <Pencil className="h-3.5 w-3.5 opacity-40" />
                </button>
              )}
              <button
                onClick={() => onToggle(bay)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${bay.is_active ? "bg-emerald-500" : "bg-navy/15"}`}
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