"use client";
import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { statusLabel } from "@/lib/vehicle-catalog-dealership";
import type { DealershipVehicle, VehicleStatus } from "@/types/concesionario";
export default function ChangeVehicleStatusModal({vehicle, target, onClose, onConfirm}: {
 vehicle: DealershipVehicle; target: VehicleStatus; onClose: () => void; onConfirm: (reason: string) => Promise<void>;
}) {
 const [reason, setReason] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
 async function confirm() {
  if (busy || reason.trim().length < 3) return; setBusy(true); setError(null);
  try { await onConfirm(reason.trim()); onClose(); }
  catch (err) { setError(err instanceof Error ? err.message : "No se pudo cambiar el estado."); }
  finally {setBusy(false);}
 }
 return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-navy/40 p-4"><div role="dialog" aria-modal="true" aria-label="Confirmar cambio de estado" className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-xl">
  <div className="flex items-center justify-between"><h2 className="font-display text-xl font-bold text-navy">Confirmar cambio de estado</h2><button disabled={busy} onClick={onClose} aria-label="Cerrar"><X /></button></div>
  <p className="text-sm text-steel">{vehicle.brand} {vehicle.model} · {statusLabel(vehicle.status)} → {statusLabel(target)}</p>
  {vehicle.status === "reservado" && <p className="text-sm text-amber-700">Se liberará la reserva y la unidad volverá a estar disponible para otros vendedores. El abono quedará en el historial.</p>}
  <label className="block text-sm font-medium text-navy">Motivo obligatorio<textarea maxLength={500} value={reason} disabled={busy} onChange={(e) => setReason(e.target.value)} className="mt-2 w-full rounded-xl border border-navy/20 p-3" /></label>
  {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
  <button disabled={busy || reason.trim().length < 3} onClick={() => void confirm()} className="flex w-full items-center justify-center gap-2 rounded-full bg-blue p-3 font-semibold text-white disabled:opacity-50">{busy && <Loader2 className="h-4 w-4 animate-spin" />}Confirmar cambio</button>
 </div></div>;
}
