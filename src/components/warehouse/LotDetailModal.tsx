"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { getLotDetail } from "@/lib/api/warehouse";
import type { LotOutboundMovement, PartLotDetail } from "@/types/warehouse";

interface LotDetailModalProps {
  lotId: string | null;
  onClose: () => void;
}

const SOURCE_LABELS: Record<string, string> = {
  venta_repuestos: "Venta de mostrador",
  odt_taller: "Orden de Servicio (Taller)",
};

function movementHref(m: LotOutboundMovement): string | null {
  if (m.source === "venta_repuestos") return `/dashboard/repuestos/ventas/${m.link_id}`;
  if (m.source === "odt_taller") return `/dashboard/servicios/${m.link_id}`;
  return null;
}

export default function LotDetailModal({ lotId, onClose }: LotDetailModalProps) {
  const [detail, setDetail] = useState<PartLotDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lotId) {
      setDetail(null);
      return;
    }
    setLoading(true);
    setError(null);
    getLotDetail(lotId)
      .then(setDetail)
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudo cargar el lote."))
      .finally(() => setLoading(false));
  }, [lotId]);

  if (!lotId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-navy/40" />
      <div className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-navy/10 px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-bold text-navy">{detail ? detail.code : "Lote"}</h2>
            {detail && (
              <p className="text-xs text-steel">
                {detail.part_code} · {detail.part_name} — {detail.warehouse_name}
              </p>
            )}
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="rounded-lg p-2 text-steel hover:bg-ash hover:text-navy">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="p-12 text-center text-sm text-steel">Cargando lote...</div>
          ) : error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          ) : detail ? (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-xs text-steel">Costo unitario</p>
                  <p className="mt-0.5 text-sm font-semibold text-navy">${detail.unit_cost.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-steel">Cant. inicial</p>
                  <p className="mt-0.5 text-sm font-semibold text-navy">{detail.quantity_received}</p>
                </div>
                <div>
                  <p className="text-xs text-steel">Cant. disponible</p>
                  <p className="mt-0.5 text-sm font-semibold text-navy">{detail.quantity_remaining}</p>
                </div>
                <div>
                  <p className="text-xs text-steel">Recibido</p>
                  <p className="mt-0.5 text-sm font-semibold text-navy">
                    {new Date(detail.received_at).toLocaleDateString("es-VE")}
                  </p>
                </div>
              </div>
              {detail.location && (
                <p className="mt-3 text-xs text-steel">
                  Ubicación: <span className="font-medium text-navy">{detail.location}</span>
                </p>
              )}

              <p className="mb-2 mt-6 font-mono text-[11px] uppercase tracking-widest text-steel">
                Salidas registradas
              </p>
              {detail.outbound_movements.length === 0 ? (
                <p className="rounded-xl bg-ash px-4 py-6 text-center text-sm text-steel">
                  Este lote todavía no tiene salidas registradas.
                </p>
              ) : (
                <div className="divide-y divide-navy/5 rounded-xl border border-navy/10">
                  {detail.outbound_movements.map((m) => {
                    const href = movementHref(m);
                    return (
                      <div key={m.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                        <div>
                          <p className="font-medium text-navy">{m.description}</p>
                          <p className="text-xs text-steel">
                            {SOURCE_LABELS[m.source] ?? m.source} ·{" "}
                            {href ? (
                              <Link href={href} className="font-mono text-blue hover:underline">
                                {m.reference_code}
                              </Link>
                            ) : (
                              <span className="font-mono">{m.reference_code}</span>
                            )}
                            {" · "}
                            {new Date(m.occurred_at).toLocaleDateString("es-VE")}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="font-semibold text-navy">{m.quantity} un.</p>
                          <p className="text-xs text-steel">${m.unit_cost.toFixed(2)} c/u</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <p className="mt-3 text-[11px] text-steel">
                No incluye transferencias entre almacenes — ese movimiento todavía no registra de qué
                lote de origen sale.
              </p>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
