import {
  FileText,
  Smartphone,
  ClipboardList,
  ShieldCheck,
  Clock,
  BarChart3,
  User,
  ShoppingCart,
  Package,
  Car,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

export interface ModuleCatalogItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

export const MODULE_CATALOG: ModuleCatalogItem[] = [
  { id: "asesor-servicios", label: "Asesor de Servicios", icon: FileText },
  { id: "tecnico-servicio", label: "Técnico de Servicio", icon: Smartphone },
  { id: "administracion", label: "Administración", icon: ClipboardList },
  { id: "usuarios-accesos", label: "Usuarios y Accesos", icon: ShieldCheck },
  { id: "post-ventas", label: "Post Ventas", icon: Clock },
  { id: "kpis", label: "KPIs", icon: BarChart3 },
  { id: "clientes-vehiculos", label: "Clientes y Vehículos", icon: User },
  { id: "repuestos", label: "Repuestos", icon: ShoppingCart },
  { id: "almacen", label: "Almacén", icon: Package },
  { id: "concesionario", label: "Concesionario", icon: Car },
  { id: "ventas", label: "Ventas", icon: TrendingUp },
];