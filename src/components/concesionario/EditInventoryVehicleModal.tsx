"use client";
import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { NumberInput } from "@/components/ui/NumberInput";
import { inventoryMileageError } from "@/lib/inventory-mileage";
import type { UpdateVehicleInput } from "@/lib/api/concesionario";
import type { DealershipVehicle } from "@/types/concesionario";
export default function EditInventoryVehicleModal({vehicle, onClose, onSave}: {
 vehicle: DealershipVehicle; onClose: () => void; onSave: (input: UpdateVehicleInput) => Promise<void>;
}) {
 const [condition, setCondition] = useState(vehicle.condition);
 const [year, setYear] = useState(String(vehicle.year));
 const [mileage, setMileage] = useState(vehicle.mileage == null ? "" : String(vehicle.mileage));
 const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
 async function save() {
  if (busy) return;
  const issue = inventoryMileageError(condition, mileage);
  if (issue) {setError(issue); return;}
  if (!year.trim() || !Number.isInteger(Number(year)) || Number(year) < 1980 || Number(year) > 2100) {setError("El año debe estar entre 1980 y 2100."); return;}
  setBusy(true); setError(null);
  try {await onSave({condition, year: Number(year), mileage: mileage.trim() ? Number(mileage) : null}); onClose();}
  catch (err) {setError(err instanceof Error ? err.message : "No se pudieron guardar los datos.");}
  finally {setBusy(false);}
 }
 return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-navy/40 p-4"><div role="dialog" aria-modal="true" aria-label="Editar datos del vehículo" className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-xl">
  <div className="flex justify-between"><h2 className="font-display text-xl font-bold text-navy">Editar datos del vehículo</h2><button disabled={busy} onClick={onClose} aria-label="Cerrar"><X /></button></div>
  <p className="text-sm text-steel">{vehicle.brand} {vehicle.model} · {vehicle.sku}</p>
  <label className="block text-sm">Tipo<select disabled={busy} value={condition} onChange={(e) => setCondition(e.target.value as typeof condition)} className="mt-1 w-full rounded-xl border p-3"><option value="nuevo">Nuevo</option><option value="usado">Usado</option></select></label>
  <label className="block text-sm">Año *<NumberInput disabled={busy} min="1980" max="2100" step="1" value={year} onValueChange={setYear} className="mt-1 w-full rounded-xl border p-3" /></label>
  <label className="block text-sm">Kilometraje (km){condition === "usado" ? " *" : " (opcional)"}<NumberInput disabled={busy} min="0" step="1" value={mileage} onValueChange={setMileage} className="mt-1 w-full rounded-xl border p-3" /></label>
  {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
  <button disabled={busy} onClick={() => void save()} className="flex w-full items-center justify-center gap-2 rounded-full bg-blue p-3 font-semibold text-white disabled:opacity-50">{busy && <Loader2 className="h-4 w-4 animate-spin" />}Guardar</button>
 </div></div>;
}
