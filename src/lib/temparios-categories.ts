import type { TemparioCategory } from "@/types/tempario";

export const CATEGORY_OPTIONS: { value: TemparioCategory; label: string; prefix: string }[] = [
  { value: "mantenimiento_preventivo", label: "Mantenimiento Preventivo", prefix: "MP" },
  { value: "frenos", label: "Frenos", prefix: "FR" },
  { value: "suspension", label: "Suspensión", prefix: "SU" },
  { value: "transmision", label: "Transmisión", prefix: "TR" },
  { value: "neumaticos", label: "Neumáticos", prefix: "NE" },
  { value: "motor", label: "Motor", prefix: "MT" },
  { value: "electrico", label: "Eléctrico", prefix: "EL" },
  { value: "aire_acondicionado", label: "Aire Acondicionado", prefix: "AC" },
  { value: "otro", label: "Otro", prefix: "OT" },
];

export const CATEGORY_STYLES: Record<TemparioCategory, { badge: string; border: string }> = {
  mantenimiento_preventivo: { badge: "bg-emerald-100 text-emerald-700", border: "border-l-emerald-500" },
  frenos: { badge: "bg-red-100 text-red-700", border: "border-l-red-500" },
  suspension: { badge: "bg-blue-light text-blue", border: "border-l-blue" },
  transmision: { badge: "bg-violet-100 text-violet-700", border: "border-l-violet-500" },
  neumaticos: { badge: "bg-amber-100 text-amber-700", border: "border-l-amber-500" },
  motor: { badge: "bg-slate-100 text-slate-700", border: "border-l-slate-500" },
  electrico: { badge: "bg-yellow-100 text-yellow-700", border: "border-l-yellow-500" },
  aire_acondicionado: { badge: "bg-sky-100 text-sky-700", border: "border-l-sky-500" },
  otro: { badge: "bg-gray-100 text-gray-700", border: "border-l-gray-400" },
};

export function categoryLabel(category: TemparioCategory): string {
  return CATEGORY_OPTIONS.find((c) => c.value === category)?.label ?? category;
}