"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ImageIcon, Loader2, Trash2, X } from "lucide-react";
import EditInventoryVehicleModal from "./EditInventoryVehicleModal";
import { getVehicleStatusHistory, type UpdateVehicleInput, type VehicleStatusEvent } from "@/lib/api/concesionario";
import { useAuth } from "@/contexts/AuthContext";
import { availableStatusOptions, ALLOWED_STATUS_TRANSITIONS, LOCATION_OPTIONS, STATUS_STYLES, statusLabel } from "@/lib/vehicle-catalog-dealership";
import { formatMoney , formatCount} from "@/lib/format";
import type { DealershipVehicle } from "@/types/concesionario";

interface Props {
  vehicle: DealershipVehicle | null;
  onClose: () => void;
  onStatusChange: (status: string) => Promise<void>;
  onLocationChange: (location: string) => Promise<void>;
  onUploadPhotos: (vehicleId: string, photos: File[]) => Promise<unknown>;
  onDeletePhoto: (vehicleId: string, photoUrl: string) => Promise<unknown>;
  onDetailsChange: (input: UpdateVehicleInput) => Promise<void>;
  canEdit?: boolean;
  reservedClientName?: string;
  reservedByName?: string;
}

export default function VehicleDetailDrawer({
  vehicle,
  onClose,
  onStatusChange,
  onLocationChange,
  onUploadPhotos,
  onDeletePhoto,
  onDetailsChange,
  canEdit = false,
  reservedClientName,
  reservedByName,
}: Props) {
  const [editingDetails, setEditingDetails] = useState(false);
  useEffect(() => {setEditingDetails(false);}, [vehicle?.id]);
  const { currentUser } = useAuth();
  const [history, setHistory] = useState<VehicleStatusEvent[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const canManage = canEdit && (vehicle?.status !== "reservado" || vehicle.reserved_by_user_id === currentUser?.userId || currentUser?.roleSlug === "filial-admin");
  useEffect(() => {
    let active = true; setHistory([]); setHistoryError(null);
    if (vehicle) getVehicleStatusHistory(vehicle.id).then((data) => { if (active) setHistory(data); }).catch((err) => { if (active) setHistoryError(err instanceof Error ? err.message : "No se pudo cargar el historial."); });
    return () => {active = false;};
  }, [vehicle]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [deletingPhoto, setDeletingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);

  const photoCount = vehicle?.images.length ?? 0;
  useEffect(() => {
    if (photoIndex >= photoCount) setPhotoIndex(Math.max(0, photoCount - 1));
  }, [photoIndex, photoCount]);

  if (!vehicle) return null;
  const symbol = vehicle.price_currency === "VES" ? "Bs." : "$";

  async function handlePhotoSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!vehicle || files.length === 0) return;
    setUploadingPhotos(true);
    setPhotoError(null);
    try {
      await onUploadPhotos(vehicle.id, files);
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "No se pudieron subir las fotos.");
    } finally {
      setUploadingPhotos(false);
    }
  }

  async function handleDeleteCurrentPhoto() {
    if (!vehicle) return;
    const url = vehicle.images[photoIndex];
    if (!url) return;
    setDeletingPhoto(true);
    setPhotoError(null);
    try {
      await onDeletePhoto(vehicle.id, url);
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "No se pudo eliminar la foto.");
    } finally {
      setDeletingPhoto(false);
    }
  }

  return <div className="fixed inset-0 z-50 flex justify-end">
    <button onClick={onClose} aria-label="Cerrar detalle" className="absolute inset-0 bg-navy/40" />
    {editingDetails && <EditInventoryVehicleModal key={vehicle.id} vehicle={vehicle} onClose={() => setEditingDetails(false)} onSave={onDetailsChange} />}
    <aside className="relative h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl">
      <header className="sticky top-0 z-10 flex items-start justify-between border-b border-navy/10 bg-white px-7 py-5">
        <div><p className="font-mono text-[10px] uppercase tracking-widest text-steel">Detalle del vehículo</p><h2 className="font-display text-2xl font-bold text-navy">{vehicle.brand} {vehicle.model}</h2><p className="text-sm text-steel">{vehicle.year} · {vehicle.sku}</p></div>
        <div className="flex items-center gap-2">
          {canManage && ALLOWED_STATUS_TRANSITIONS[vehicle.status].includes("vendido") && (
            <button
              onClick={() => void onStatusChange("vendido")}
              className="rounded-full bg-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-navy"
            >
              Vender vehículo
            </button>
          )}
          {canManage && <button onClick={() => setEditingDetails(true)} className="rounded-full border border-blue/30 px-3 py-2 text-sm font-semibold text-blue">Editar datos</button>}
          <button onClick={onClose} className="rounded-lg p-2 text-steel hover:bg-ash"><X className="h-5 w-5" /></button>
        </div>
      </header>
      <div className="space-y-6 p-7">
        <section><h3 className="mb-3 font-semibold text-navy">Historial de estados</h3>{historyError && <p role="alert" className="text-sm text-red-600">{historyError}</p>}{!historyError && history.length === 0 && <p className="text-sm text-steel">Sin cambios registrados.</p>}<ol className="space-y-3">{history.map((event) => <li key={event.id} className="rounded-xl border border-navy/10 p-3 text-sm"><p className="font-semibold text-navy">{event.previous_status ? statusLabel(event.previous_status) : "Alta"} → {statusLabel(event.new_status)}</p><p className="text-xs text-steel">{event.user_name} · {new Date(event.created_at).toLocaleString("es-VE", {timeZone: "America/Caracas"})}</p><p className="mt-1 break-words text-steel">{event.reason}</p>{event.reservation_snapshot && <p className="mt-1 text-xs text-steel">Abono: {vehicle.price_currency === "VES" ? "Bs." : "$"} {formatMoney(event.reservation_snapshot.deposit_amount)} · Vigencia: {event.reservation_snapshot.expires_at ?? "—"}</p>}</li>)}</ol></section>
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-semibold text-navy">Fotos</h3>
            <label className="flex cursor-pointer items-center gap-1.5 rounded-full border border-blue/25 px-2.5 py-1 text-xs font-semibold text-blue transition hover:bg-blue-light">
              {uploadingPhotos ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
              Agregar fotos
              <input type="file" accept="image/*" multiple className="hidden" disabled={uploadingPhotos} onChange={handlePhotoSelect} />
            </label>
          </div>
          {photoCount > 0 ? (
            <div>
              <div className="relative overflow-hidden rounded-xl bg-ash">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={vehicle.images[photoIndex]}
                  alt={`${vehicle.brand} ${vehicle.model} — foto ${photoIndex + 1}`}
                  className="aspect-video w-full object-cover"
                />
                {photoCount > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setPhotoIndex((i) => (i - 1 + photoCount) % photoCount)}
                      aria-label="Foto anterior"
                      className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-navy/50 p-1.5 text-white hover:bg-navy/70"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoIndex((i) => (i + 1) % photoCount)}
                      aria-label="Foto siguiente"
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-navy/50 p-1.5 text-white hover:bg-navy/70"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    <span className="absolute bottom-2 right-2 rounded-full bg-navy/60 px-2 py-0.5 text-xs font-semibold text-white">
                      {photoIndex + 1}/{formatCount(photoCount)}
                    </span>
                  </>
                )}
                <button
                  type="button"
                  onClick={handleDeleteCurrentPhoto}
                  disabled={deletingPhoto}
                  aria-label="Eliminar esta foto"
                  className="absolute right-2 top-2 rounded-full bg-red-600/90 p-1.5 text-white transition hover:bg-red-700 disabled:opacity-50"
                >
                  {deletingPhoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </button>
              </div>
              {photoCount > 1 && (
                <div className="mt-2 flex justify-center gap-1.5">
                  {vehicle.images.map((url, index) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setPhotoIndex(index)}
                      aria-label={`Ver foto ${index + 1}`}
                      className={`h-1.5 rounded-full transition-all ${index === photoIndex ? "w-5 bg-blue" : "w-1.5 bg-navy/20"}`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-navy/15 bg-ash/60 text-sm text-steel">
              Sin fotos
            </div>
          )}
          {photoError && <p className="mt-2 text-xs text-red-600">{photoError}</p>}
        </section>

        <section className="rounded-2xl border border-navy/10 p-5">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-steel">Estado operativo</label>
          <select disabled={!canManage} value={vehicle.status} onChange={(event) => void onStatusChange(event.target.value)} className={`w-full rounded-xl border px-4 py-3 text-sm font-semibold outline-none ${STATUS_STYLES[vehicle.status]}`}>
            {availableStatusOptions(vehicle.status).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <p className="mt-2 text-xs text-steel">Cada cambio requiere confirmación y deja usuario, fecha y motivo en el historial.</p>
          {vehicle.status === "reservado" && (
            <div className="mt-3 rounded-xl border border-blue/20 bg-blue-light/40 p-4 text-sm">
              <p className="text-navy">
                Reservado para <span className="font-semibold">{reservedClientName ?? "—"}</span> por{" "}
                <span className="font-semibold">{reservedByName ?? "—"}</span>
              </p>
              <p className="mt-1 text-steel">
                Abono {symbol} {formatMoney(Number(vehicle.deposit_amount ?? 0))} · vigente hasta{" "}
                {vehicle.reservation_expires_at
                  ? new Date(`${vehicle.reservation_expires_at}T12:00:00`).toLocaleDateString("es-VE")
                  : "—"}
              </p>
            </div>
          )}
        </section>

        <section><h3 className="mb-3 font-semibold text-navy">Identificación y características</h3><dl className="grid grid-cols-2 gap-4 rounded-2xl bg-ash/60 p-5 text-sm">
          <div><dt className="text-steel">VIN</dt><dd className="break-all font-medium text-navy">{vehicle.vin}</dd></div><div><dt className="text-steel">Placa</dt><dd className="font-medium text-navy">{vehicle.plate ?? "—"}</dd></div>
          <div><dt className="text-steel">Kilometraje</dt><dd className="font-medium text-navy">{vehicle.mileage == null ? "No registrado" : `${formatCount(vehicle.mileage)} km`}</dd></div>
          <div><dt className="text-steel">Condición</dt><dd className="font-medium capitalize text-navy">{vehicle.condition}</dd></div><div><dt className="text-steel">Color</dt><dd className="font-medium text-navy">{vehicle.color ?? "—"}</dd></div>
          <div><dt className="text-steel">Combustible</dt><dd className="font-medium capitalize text-navy">{vehicle.fuel_type ?? "—"}</dd></div><div><dt className="text-steel">Transmisión</dt><dd className="font-medium capitalize text-navy">{vehicle.transmission ?? "—"}</dd></div>
          <div>
            <dt className="text-steel">Ubicación</dt>
            <dd>
              <select
                value={vehicle.location ?? ""}
                onChange={(event) => void onLocationChange(event.target.value)}
                className="mt-1 w-full rounded-lg border border-navy/15 px-2.5 py-1.5 text-sm font-medium text-navy outline-none focus:border-blue"
              >
                {!vehicle.location && <option value="" disabled>Selecciona una ubicación</option>}
                {LOCATION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </dd>
          </div>
        </dl></section>

        <section><h3 className="mb-3 font-semibold text-navy">Precio de lista</h3><dl className="space-y-2 rounded-2xl border border-navy/10 p-5 text-sm">
          <div className="flex justify-between"><dt>PVP contado</dt><dd className="font-semibold">{symbol} {formatMoney(vehicle.price_cash)}</dd></div>
          <div className="flex justify-between"><dt>IVA ({formatCount(vehicle.iva_percentage)}%)</dt><dd>{symbol} {formatMoney(vehicle.iva_amount)}</dd></div>
          {vehicle.luxury_tax_percentage > 0 && <div className="flex justify-between"><dt>Impuesto al lujo ({formatCount(vehicle.luxury_tax_percentage)}%)</dt><dd>{symbol} {formatMoney(vehicle.luxury_tax_amount)}</dd></div>}
          <div className="flex justify-between border-t border-navy/10 pt-2 font-bold text-navy"><dt>Precio de lista (contado)</dt><dd>{symbol} {formatMoney(vehicle.cash_total)}</dd></div>
          <p className="text-xs text-steel">No incluye IGTF — se calcula al vender, según cuánto se cobre en divisas.</p>
          <div className="flex justify-between"><dt>Precio financiado</dt><dd className="font-semibold">{symbol} {formatMoney(vehicle.price_financed)}</dd></div>
          <div className="flex justify-between text-steel"><dt>Financiamiento</dt><dd className="capitalize">{vehicle.financing_provider ?? "Sin proveedor"}</dd></div>
          <div className="flex justify-between text-steel"><dt>Estado actual</dt><dd>{statusLabel(vehicle.status)}</dd></div>
        </dl></section>
      </div>
    </aside>
  </div>;
}
