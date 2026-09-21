import type { VehicleStatus } from "@/types/concesionario";

export const VEHICLE_COLORS = [
  "Blanco", "Negro", "Gris", "Plata", "Azul", "Rojo", "Verde", "Beige", "Marrón", "Amarillo", "Naranja",
];

export const STATUS_OPTIONS: { value: VehicleStatus; label: string }[] = [
  { value: "en_transito", label: "En tránsito" },
  { value: "disponible", label: "Entrega Inmediata" },
  { value: "en_preparacion", label: "En preparación para entrega" },
  { value: "reservado", label: "Reservado" },
  { value: "vendido", label: "Vendido" },
];

export const STATUS_LABELS: Record<VehicleStatus, string> = {
  en_transito: "En tránsito",
  disponible: "Entrega Inmediata",
  en_preparacion: "En preparación para entrega",
  reservado: "Reservado",
  vendido: "Vendido",
};

export const STATUS_STYLES: Record<VehicleStatus, string> = {
  en_transito: "border-navy/15 text-steel",
  disponible: "border-emerald-200 bg-emerald-50 text-emerald-700",
  en_preparacion: "border-amber-200 bg-amber-50 text-amber-700",
  reservado: "border-blue/30 bg-blue-light text-blue",
  vendido: "border-slate-300 bg-slate-100 text-slate-600",
};

export function statusLabel(status: VehicleStatus): string {
  return STATUS_LABELS[status] ?? status;
}

// Mirrors the backend's ConcesionarioService.ALLOWED_TRANSITIONS — kept in
// sync so the dropdown only ever offers a transition the server will
// actually accept; the server still re-validates and is the source of truth.
export const ALLOWED_STATUS_TRANSITIONS: Record<VehicleStatus, VehicleStatus[]> = {
  en_transito: ["disponible", "en_preparacion"],
  en_preparacion: ["disponible"],
  disponible: ["en_preparacion", "reservado", "vendido"],
  reservado: ["disponible", "vendido"],
  vendido: [],
};

/** The current status plus whatever it can legally move to — always
 * includes the current value so a <select> can show it as selected. */
export function availableStatusOptions(
  current: VehicleStatus
): { value: VehicleStatus; label: string }[] {
  const targets = new Set([current, ...ALLOWED_STATUS_TRANSITIONS[current]]);
  return STATUS_OPTIONS.filter((option) => targets.has(option.value));
}
