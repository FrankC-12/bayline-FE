import { CalendarClock, FileText, ShieldCheck, ShieldPlus } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/dashboard/post-ventas", label: "Temparios", icon: FileText },
  { href: "/dashboard/post-ventas/planes", label: "Planes de Mantenimiento", icon: CalendarClock },
  { href: "/dashboard/post-ventas/garantias", label: "Garantías de Fábrica", icon: ShieldCheck },
  { href: "/dashboard/post-ventas/politicas-garantia", label: "Políticas de Garantía", icon: ShieldPlus },
];
