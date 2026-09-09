import type { LucideIcon } from "lucide-react";
import { FileText, CheckSquare, ClipboardList, Calendar } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon | null;
  indent?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard/servicios", label: "Órdenes de Servicio", icon: FileText },
  { href: "/dashboard/servicios/historial", label: "Historial de Órdenes", icon: null, indent: true },
  { href: "/dashboard/servicios/upsells", label: "Upsells", icon: CheckSquare },
  { href: "/dashboard/servicios/inspecciones", label: "Inspecciones Prelim.", icon: ClipboardList },
  { href: "/dashboard/servicios/calendario", label: "Calendario del Taller", icon: Calendar },
];
