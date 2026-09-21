"use client";

import { X } from "lucide-react";

interface ConfirmDialogReason {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  minLength?: number;
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  confirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  /** When set, renders a mandatory textarea (e.g. "motivo de cancelación")
   * and keeps the confirm button disabled until it meets `minLength`. */
  reason?: ConfirmDialogReason;
}

/** Shared confirmation dialog for actions that are hard or impossible to
 * undo (e.g. dispatching stock to a service order) — asks once, up front,
 * instead of letting the action fire immediately on click. */
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancelar",
  confirming = false,
  onConfirm,
  onCancel,
  reason,
}: ConfirmDialogProps) {
  if (!open) return null;

  const reasonTooShort = !!reason && reason.value.trim().length < (reason.minLength ?? 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onCancel} className="absolute inset-0 bg-navy/40" />
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-display text-2xl font-bold text-navy">{title}</h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cerrar"
            className="rounded-xl border border-navy/15 p-2 text-navy transition hover:bg-ash"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-4 text-[15px] leading-relaxed text-steel">{description}</p>

        {reason && (
          <label className="mt-4 block text-sm text-navy">
            {reason.label}
            <textarea
              value={reason.value}
              onChange={(e) => reason.onChange(e.target.value)}
              placeholder={reason.placeholder}
              rows={3}
              className="mt-1.5 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
            />
          </label>
        )}

        <div className="mt-8 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={confirming}
            className="rounded-full border border-navy/15 px-6 py-3 text-sm font-semibold text-navy transition hover:border-navy/40 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirming || reasonTooShort}
            className="rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue disabled:opacity-50"
          >
            {confirming ? "Enviando..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
