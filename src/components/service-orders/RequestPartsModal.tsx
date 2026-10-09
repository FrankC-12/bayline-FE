"use client";

import { useEffect, useState } from "react";
import { Warehouse, Loader2 } from "lucide-react";
import { previewWorkshopRequest, type WorkshopRequestPreview } from "@/lib/api/serviceOrders";

export default function RequestPartsModal({ requestId, busy, onSend, onClose }: { requestId: string | null; busy: boolean; onSend: () => Promise<void>; onClose: () => void }) {
  const [preview, setPreview] = useState<WorkshopRequestPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    setPreview(null); setError(null);
    if (!requestId) return;
    let active = true;
    previewWorkshopRequest(requestId).then((data) => { if (active) setPreview(data); }).catch((err) => { if (active) setError(err instanceof Error ? err.message : "No se pudo revisar la disponibilidad."); });
    return () => { active = false; };
  }, [requestId, retry]);
  if (!requestId) return null;
  const local = preview?.lines.filter((line) => line.local_quantity > 0) ?? [];
  const transfers = preview?.lines.filter((line) => line.transfer_quantity > 0) ?? [];
  const backorders = preview?.lines.filter((line) => line.shortfall_quantity > 0) ?? [];
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-navy/30 p-4" onClick={() => { if (!busy) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="request-parts-title" onClick={(event) => event.stopPropagation()} className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <header className="border-b border-navy/10 px-7 py-6">
          <p className="font-mono text-xs text-steel">{preview ? `${preview.order_code} · ${preview.vehicle_label}` : "Solicitud del taller"}</p>
          <h2 id="request-parts-title" className="mt-1 font-display text-2xl font-bold text-navy">Solicitar repuestos</h2>
          <p className="mt-1 text-sm text-steel">Revisa los ítems. El almacén se asigna automáticamente.</p>
        </header>
        <div className="min-h-[340px] overflow-y-auto px-7 py-5">
          {error && <div role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}<button type="button" onClick={() => setRetry((value) => value+1)} className="ml-3 underline">Reintentar</button></div>}
          {!preview && !error && <p className="flex items-center gap-2 text-sm text-steel"><Loader2 className="h-4 w-4 animate-spin" /> Revisando disponibilidad…</p>}
          {preview && <>
            <div className="mb-5 flex items-center gap-4 rounded-xl bg-blue-light p-4 text-blue">
              <Warehouse className="h-6 w-6" /><div><p className="font-semibold">Se enviará a {preview.warehouse_name}</p><p className="text-xs">Regla de la sucursal: solicitudes de taller → {preview.warehouse_name}</p></div>
            </div>
            <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-navy/10 font-mono text-[11px] uppercase tracking-wider text-steel"><th className="py-2">Cant.</th><th className="py-2">Repuesto</th><th className="py-2">Disponibilidad</th></tr></thead><tbody>
              {preview.lines.map((line) => <tr key={line.id} className="border-b border-navy/10"><td className="py-5 font-bold">{line.quantity}x</td><td className="py-5 pr-3">{line.part_name}</td><td className="py-5"><div className="flex flex-col items-start gap-1">
                {line.local_quantity > 0 && <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Disponible en {preview.warehouse_name} · se reserva {line.local_quantity}</span>}
                {line.transfer_quantity > 0 && <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-800">Traslado automático: {line.transfer_quantity} desde {Array.from(new Set(line.allocations.filter((item) => item.warehouse_id !== preview.warehouse_id).map((item) => item.warehouse_name))).join(", ")}</span>}
                {line.shortfall_quantity > 0 && <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">Sin stock en la sucursal · faltan {line.shortfall_quantity}</span>}
              </div></td></tr>)}
            </tbody></table></div>
            <div className="mt-5 space-y-2 rounded-xl border border-navy/10 bg-ash/60 p-4 text-sm"><p className="font-bold">Al enviar se generará</p>
              <p><strong className="mr-5 font-mono">DSP</strong>Solicitud a {preview.warehouse_name} → Taller con {preview.lines.length} ítems{transfers.length ? "; espera a recibir los traslados antes de despachar" : ""}.</p>
              {transfers.map((line) => <p key={line.id}><strong className="mr-5 font-mono">TRF</strong>{line.transfer_quantity}x {line.part_name} → {preview.warehouse_name}</p>)}
              {backorders.map((line) => <p key={line.id}><strong className="mr-5 font-mono">Backorder</strong>{line.shortfall_quantity}x {line.part_name} queda pendiente y se notifica a Compras.</p>)}
              {local.length === 0 && transfers.length === 0 && <p className="text-red-700">La solicitud quedará en espera de reposición.</p>}
            </div>
          </>}
        </div>
        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-navy/10 px-7 py-5">
          <p className="max-w-sm text-xs text-steel">El stock se reserva ahora y se descuenta cuando el almacenista completa el despacho.</p>
          <div className="flex gap-2"><button type="button" disabled={busy} onClick={onClose} className="rounded-full border border-navy/15 px-5 py-3 text-sm font-semibold">Cancelar</button><button type="button" disabled={busy || !preview} onClick={async () => { setError(null); try { await onSend(); } catch (err) { setError(err instanceof Error ? err.message : "No se pudo enviar la solicitud."); } }} className="rounded-full bg-blue px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Enviando…" : "Enviar solicitud"}</button></div>
        </footer>
      </section>
    </div>
  );
}
