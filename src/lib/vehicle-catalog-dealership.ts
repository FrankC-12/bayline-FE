import type { VehicleStatus } from "@/types/concesionario";

export const BRAND_MODELS: Record<string, string[]> = {
  Toyota: ["Corolla", "Yaris", "Hilux", "Fortuner", "4Runner", "Prado", "Camry", "Hiace", "RAV4"],
  Lexus: ["ES", "IS", "RX", "NX", "GX", "LX", "UX"],
  Kia: ["Sportage", "Rio", "Sorento", "Picanto"],
  Chevrolet: ["Aveo", "Spark", "Captiva", "Silverado"],
};

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
