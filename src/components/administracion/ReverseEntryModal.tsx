"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";

interface ReverseEntryModalProps {
  description: string;
  submitting: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export default function ReverseEntryModal({ description, submitting, onClose, onConfirm }: ReverseEntryModalProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    if (reason.trim().length < 3) {
      setError("Escribe el motivo del reverso (mínimo 3 caracteres).");
      return;
    }
    onConfirm(reason.trim());
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-navy/40" />
      <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-navy/10 px-6 py-4">
          <h2 className="font-display text-lg font-bold text-navy">Reversar movimiento</h2>
          <button onClick={onClose} aria-label="Cerrar" className="rounded-lg p-2 text-steel hover:bg-ash hover:text-navy">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4 p-6">
          <p className="text-sm text-steel">{description}</p>
          <p className="text-xs text-steel">Se creará un nuevo movimiento en sentido contrario, fechado hoy.</p>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Motivo del reverso *</label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError(null);
              }}
              rows={3}
              placeholder="Ej. Monto digitado incorrectamente"
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
            />
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-red-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Confirmar reverso
          </button>
        </div>
      </div>
    </div>
  );
}
