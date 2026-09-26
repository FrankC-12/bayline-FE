"use client";

import { useState } from "react";
import { AlertTriangle, Camera, Check, Loader2, X } from "lucide-react";
import { usePendingUpsells } from "@/hooks/usePendingUpsells";
import { decideUpsell } from "@/lib/api/upsells";
import DiscardUpsellModal from "./DiscardUpsellModal";
import type { PendingUpsell, UpsellApprovalChannel, UpsellDiscardReason, UpsellSeverity } from "@/types/upsells";

const SEVERITY_LABELS: Record<UpsellSeverity, string> = {
  urgente: "Urgente",
  pronto: "Pronto",
  monitorear: "Monitorear",
};

const SEVERITY_STYLES: Record<UpsellSeverity, string> = {
  urgente: "bg-red-100 text-red-700",
  pronto: "bg-amber-100 text-amber-700",
  monitorear: "bg-slate-100 text-slate-600",
};

const CHANNEL_OPTIONS: { value: UpsellApprovalChannel; label: string }[] = [
  { value: "presencial", label: "Presencial" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "llamada", label: "Llamada telefónica" },
  { value: "sms", label: "SMS" },
  { value: "correo", label: "Correo" },
];

const usd = (value: number) => `$${value.toLocaleString("es-VE", { minimumFractionDigits: 2 })}`;

interface PendingUpsellsBlockProps {
  vehicleId: string;
  orderId: string;
  /** An order that's invoiced/closed/cancelled can't accept new lines —
   * "Agregar a esta ODS" is hidden, but Descartar/Mantener pendiente still work. */
  readOnly: boolean;
  onApplied?: () => void;
}

export default function PendingUpsellsBlock({ vehicleId, orderId, readOnly, onApplied }: PendingUpsellsBlockProps) {
  const { pendingUpsells, loading, remove } = usePendingUpsells(vehicleId, orderId);
  const [applyingUpsell, setApplyingUpsell] = useState<PendingUpsell | null>(null);
  const [discardingUpsell, setDiscardingUpsell] = useState<PendingUpsell | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  if (loading || pendingUpsells.length === 0) return null;

  async function handleApply(upsell: PendingUpsell, channel: UpsellApprovalChannel) {
    setActingId(upsell.id);
    try {
      await decideUpsell(upsell.id, { status: "aprobado", approval_channel: channel, target_service_order_id: orderId });
      remove(upsell.id);
      setApplyingUpsell(null);
      onApplied?.();
    } finally {
      setActingId(null);
    }
  }

  async function handleDiscard(upsell: PendingUpsell, reason: UpsellDiscardReason, note: string | undefined) {
    setActingId(upsell.id);
    try {
      await decideUpsell(upsell.id, { status: "rechazado", discard_reason: reason, discard_note: note });
      remove(upsell.id);
      setDiscardingUpsell(null);
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50/60 p-6">
      <div className="mb-4 flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-amber-600" />
        <span className="font-display text-lg font-bold text-amber-700">
          Este vehículo tiene {pendingUpsells.length} recomendación{pendingUpsells.length !== 1 ? "es" : ""} pendiente
          {pendingUpsells.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="space-y-4">
        {pendingUpsells.map((u, i) => (
          <div key={u.id} className={`flex items-start justify-between gap-6 pt-4 ${i > 0 ? "border-t border-amber-200" : ""}`}>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-display text-lg font-bold text-navy">{u.title}</p>
                <span className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest ${SEVERITY_STYLES[u.severity]}`}>
                  {SEVERITY_LABELS[u.severity]}
                </span>
                <span className="rounded-full bg-blue-light px-2.5 py-1 text-xs font-bold text-blue">{usd(u.amount)}</span>
              </div>
              <p className="mt-1 text-sm text-steel">{u.description}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-steel">
                <span className="font-mono text-blue">{u.origin_service_order_code}</span>
                <span>·</span>
                <span>{new Date(u.created_at).toLocaleDateString("es-VE")}</span>
                {u.detected_mileage != null && (
                  <>
                    <span>·</span>
                    <span>{u.detected_mileage.toLocaleString("es-VE")} km</span>
                  </>
                )}
                {u.photo_urls.length > 0 && (
                  <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                    <Camera className="h-3 w-3" />
                    {u.photo_urls.length} evidencia{u.photo_urls.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => setDiscardingUpsell(u)}
                disabled={actingId === u.id}
                className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >
                Descartar
              </button>
              <button
                onClick={() => remove(u.id)}
                disabled={actingId === u.id}
                className="rounded-full border border-navy/15 px-4 py-2 text-sm font-semibold text-navy transition hover:bg-ash disabled:opacity-50"
              >
                Mantener pendiente
              </button>
              {!readOnly && (
                <button
                  onClick={() => setApplyingUpsell(u)}
                  disabled={actingId === u.id}
                  className="flex items-center gap-1.5 rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-50"
                >
                  {actingId === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Agregar a esta ODS
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {applyingUpsell && (
        <ApplyToOrderModal
          upsell={applyingUpsell}
          submitting={actingId === applyingUpsell.id}
          onClose={() => setApplyingUpsell(null)}
          onConfirm={(channel) => handleApply(applyingUpsell, channel)}
        />
      )}

      {discardingUpsell && (
        <DiscardUpsellModal
          title={discardingUpsell.title}
          submitting={actingId === discardingUpsell.id}
          onClose={() => setDiscardingUpsell(null)}
          onConfirm={(reason, note) => handleDiscard(discardingUpsell, reason, note)}
        />
      )}
    </div>
  );
}

function ApplyToOrderModal({
  upsell,
  submitting,
  onClose,
  onConfirm,
}: {
  upsell: PendingUpsell;
  submitting: boolean;
  onClose: () => void;
  onConfirm: (channel: UpsellApprovalChannel) => void;
}) {
  const [channel, setChannel] = useState<UpsellApprovalChannel>("presencial");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-navy/40" />
      <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-navy/10 px-6 py-4">
          <h2 className="font-display text-lg font-bold text-navy">Agregar a esta ODS</h2>
          <button onClick={onClose} aria-label="Cerrar" className="rounded-lg p-2 text-steel hover:bg-ash hover:text-navy">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4 p-6">
          <p className="text-sm text-steel">
            {upsell.title} · <span className="font-semibold text-navy">precio recalculado a la tarifa/costo de hoy</span>
          </p>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">¿Por qué medio aprobó el cliente? *</label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as UpsellApprovalChannel)}
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
            >
              {CHANNEL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => onConfirm(channel)}
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-700 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
