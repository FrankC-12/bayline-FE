"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import type { UpsellDiscardReason } from "@/types/upsells";

const REASON_OPTIONS: { value: UpsellDiscardReason; label: string }[] = [
  { value: "ya_reparado_otro_taller", label: "Ya reparado en otro taller" },
  { value: "cliente_no_lo_quiere", label: "El cliente no lo quiere" },
  { value: "ya_no_aplica", label: "Ya no aplica" },
  { value: "otro", label: "Otro" },
];

interface DiscardUpsellModalProps {
  title: string;
  submitting: boolean;
  onClose: () => void;
  onConfirm: (reason: UpsellDiscardReason, note: string | undefined) => void;
}

export default function DiscardUpsellModal({ title, submitting, onClose, onConfirm }: DiscardUpsellModalProps) {
  const [reason, setReason] = useState<UpsellDiscardReason>("ya_reparado_otro_taller");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    if (reason === "otro" && !note.trim()) {
      setError("Describe el motivo cuando eliges 'Otro'.");
      return;
    }
    onConfirm(reason, note.trim() || undefined);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-navy/40" />
      <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-navy/10 px-6 py-4">
          <h2 className="font-display text-lg font-bold text-navy">Descartar recomendación</h2>
          <button onClick={onClose} aria-label="Cerrar" className="rounded-lg p-2 text-steel hover:bg-ash hover:text-navy">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4 p-6">
          <p className="text-sm text-steel">{title}</p>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Motivo *</label>
            <select
              value={reason}
              onChange={(e) => {
                setReason(e.target.value as UpsellDiscardReason);
                setError(null);
              }}
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
            >
              {REASON_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          {reason === "otro" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">Nota *</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
              />
            </div>
          )}
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-red-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Confirmar descarte
          </button>
        </div>
      </div>
    </div>
  );
}
