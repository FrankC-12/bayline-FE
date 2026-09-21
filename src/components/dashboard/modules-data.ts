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
  Settings,
  type LucideIcon,
} from "lucide-react";
import { NAV_ITEMS as SERVICE_ORDERS_ITEMS } from "@/components/service-orders/nav-items";
import { ADMIN_ITEMS, FINANCE_ITEMS } from "@/components/administracion/nav-items";
import { NAV_ITEMS as POST_VENTAS_ITEMS } from "@/components/post-ventas/nav-items";
import { NAV_ITEMS as KPIS_ITEMS } from "@/components/kpis/nav-items";
import { NAV_ITEMS as PARTS_ITEMS } from "@/components/parts/nav-items";
import { NAV_ITEMS as WAREHOUSE_ITEMS } from "@/components/warehouse/nav-items";
import { NAV_ITEMS as CONCESIONARIO_ITEMS } from "@/components/concesionario/nav-items";
import { NAV_ITEMS as VENTAS_ITEMS } from "@/components/ventas/nav-items";

/** "3 MÓDULOS" / "1 MÓDULO" — derived from a module's own nav-item count, never hand-typed. */
function moduleBadge(count: number): string {
  return `${count} MÓDULO${count === 1 ? "" : "S"}`;
}

export interface ModuleCardData {
  icon: LucideIcon;
  title: string;
  description: string;
  badge: string;
  tint: string;
  href?: string;
  /** Matches a key in the caller's access map (GET /auth/access) — see
   * app/scripts/seed_roles.py's ALL_MODULES on the backend for the
   * authoritative list. A card with no moduleId (the mobile-only
   * "Técnico de Servicio" placeholder) is never filtered out. */
  moduleId?: string;
}

export const modules: ModuleCardData[] = [
  {
    icon: FileText,
    title: "Asesor de Servicios",
    description: "Inspecciones, órdenes de servicio, tareas y facturación del taller.",
    badge: moduleBadge(SERVICE_ORDERS_ITEMS.length),
    tint: "bg-indigo-100 text-indigo-600",
    href: "/dashboard/servicios",
    moduleId: "asesor-servicios",
  },
  {
    icon: Smartphone,
    title: "Técnico de Servicio",
    description: "Acceso móvil: tareas asignadas, cronómetro, inspección minuciosa y upsells.",
    badge: "VISTA MÓVIL",
    tint: "bg-amber-100 text-amber-600",
    moduleId: "tecnico-servicio",
  },
  {
    icon: ClipboardList,
    title: "Administración",
    description: "Compras a proveedores, reclamos y finanzas del taller.",
    badge: moduleBadge(ADMIN_ITEMS.length + FINANCE_ITEMS.length),
    tint: "bg-emerald-100 text-emerald-700",
    href: "/dashboard/administracion",
    moduleId: "administracion",
  },
  {
    icon: ShieldCheck,
    title: "Usuarios y Accesos",
    description:
      "Módulo exclusivo del súper administrador: usuarios del sistema, roles y permisos.",
    badge: "SÚPER ADMIN",
    tint: "bg-violet-100 text-violet-700",
    href: "/dashboard/usuarios",
    moduleId: "usuarios-accesos",
  },
  {
    icon: Clock,
    title: "Post Ventas",
    description:
      "Catálogo oficial de tempario: tiempos estándar, repuestos y precio calculado por servicio.",
    badge: moduleBadge(POST_VENTAS_ITEMS.length),
    tint: "bg-rose-100 text-rose-600",
    href: "/dashboard/post-ventas",
    moduleId: "post-ventas",
  },
  {
    icon: BarChart3,
    title: "KPIs",
    description: "Métricas de tiempos operativos del taller: técnicos, asesores y almacenistas.",
    badge: moduleBadge(KPIS_ITEMS.length),
    tint: "bg-violet-100 text-violet-700",
    href: "/dashboard/kpis",
    moduleId: "kpis",
  },
  {
    icon: User,
    title: "Clientes y Vehículos",
    description:
      "Base de datos compartida de clientes y vehículos — usada por Taller, Concesionario y Venta de Repuestos.",
    badge: "1 MÓDULO",
    tint: "bg-rose-100 text-rose-600",
    href: "/dashboard/clientes",
    moduleId: "clientes-vehiculos",
  },
  {
    icon: ShoppingCart,
    title: "Repuestos",
    description: "Venta de repuestos al público: catálogo con precios, ventas y devoluciones.",
    badge: moduleBadge(PARTS_ITEMS.length),
    tint: "bg-slate-100 text-slate-600",
    href: "/dashboard/repuestos",
    moduleId: "repuestos",
  },
  {
    icon: Package,
    title: "Almacén",
    description:
      "Operación interna del almacenista: inventario por almacén, movimientos, transferencias y lotes FIFO.",
    badge: moduleBadge(WAREHOUSE_ITEMS.length),
    tint: "bg-blue-light text-blue",
    href: "/dashboard/almacen",
    moduleId: "almacen",
  },
  {
    icon: Car,
    title: "Concesionario",
    description: "Catálogo de vehículos, inventario y ventas del concesionario.",
    badge: moduleBadge(CONCESIONARIO_ITEMS.length),
    tint: "bg-orange-100 text-orange-700",
    href: "/dashboard/concesionario",
    moduleId: "concesionario",
  },
  {
    icon: TrendingUp,
    title: "Ventas",
    description: "Cotizaciones, pedidos y seguimiento comercial del concesionario y venta de repuestos.",
    badge: moduleBadge(VENTAS_ITEMS.length),
    tint: "bg-emerald-100 text-emerald-700",
    href: "/dashboard/ventas",
    moduleId: "ventas",
  },
  {
    icon: Settings,
    title: "Ajustes",
    description: "Parámetros financieros y operativos del negocio: IVA, IGTF, tasa BCV, comisión y mano de obra.",
    badge: "1 MÓDULO",
    tint: "bg-slate-100 text-slate-600",
    href: "/dashboard/ajustes",
    moduleId: "ajustes",
  },
];
