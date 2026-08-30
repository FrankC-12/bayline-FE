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

export interface ModuleCardData {
  icon: LucideIcon;
  title: string;
  description: string;
  badge: string;
  tint: string;
  href?: string;
}

export const modules: ModuleCardData[] = [
  {
    icon: FileText,
    title: "Asesor de Servicios",
    description: "Inspecciones, órdenes de servicio, tareas y facturación del taller.",
    badge: "3 MÓDULOS",
    tint: "bg-indigo-100 text-indigo-600",
    href: "/dashboard/servicios",
  },
  {
    icon: Smartphone,
    title: "Técnico de Servicio",
    description: "Acceso móvil: tareas asignadas, cronómetro, inspección minuciosa y upsells.",
    badge: "VISTA MÓVIL",
    tint: "bg-amber-100 text-amber-600",
  },
  {
    icon: ClipboardList,
    title: "Administración",
    description: "Compras a proveedores, reclamos y finanzas del taller.",
    badge: "5 MÓDULOS",
    tint: "bg-emerald-100 text-emerald-700",
    href: "/dashboard/administracion",
  },
  {
    icon: ShieldCheck,
    title: "Usuarios y Accesos",
    description:
      "Módulo exclusivo del súper administrador: usuarios del sistema, roles y permisos.",
    badge: "SÚPER ADMIN",
    tint: "bg-violet-100 text-violet-700",
    href: "/dashboard/usuarios",
  },
  {
    icon: Clock,
    title: "Post Ventas",
    description:
      "Catálogo oficial de tempario: tiempos estándar, repuestos y precio calculado por servicio.",
    badge: "1 MÓDULO",
    tint: "bg-rose-100 text-rose-600",
    href: "/dashboard/post-ventas",
  },
  {
    icon: BarChart3,
    title: "KPIs",
    description: "Métricas de tiempos operativos del taller: técnicos, asesores y almacenistas.",
    badge: "1 MÓDULO",
    tint: "bg-violet-100 text-violet-700",
    href: "/dashboard/kpis",
  },
  {
    icon: User,
    title: "Clientes y Vehículos",
    description:
      "Base de datos compartida de clientes y vehículos — usada por Taller, Concesionario y Venta de Repuestos.",
    badge: "1 MÓDULO",
    tint: "bg-rose-100 text-rose-600",
    href: "/dashboard/clientes",
  },
  {
    icon: ShoppingCart,
    title: "Repuestos",
    description: "Venta de repuestos al público: catálogo con precios, ventas y devoluciones.",
    badge: "3 MÓDULOS",
    tint: "bg-slate-100 text-slate-600",
    href: "/dashboard/repuestos",
  },
  {
    icon: Package,
    title: "Almacén",
    description:
      "Operación interna del almacenista: inventario por almacén, movimientos, transferencias y lotes FIFO.",
    badge: "4 MÓDULOS",
    tint: "bg-blue-light text-blue",
    href: "/dashboard/almacen",
  },
  {
    icon: Car,
    title: "Concesionario",
    description: "Catálogo de vehículos, inventario y ventas del concesionario.",
    badge: "3 MÓDULOS",
    tint: "bg-orange-100 text-orange-700",
    href: "/dashboard/concesionario",
  },
  {
    icon: TrendingUp,
    title: "Ventas",
    description: "Cotizaciones, pedidos y seguimiento comercial del concesionario y venta de repuestos.",
    badge: "2 MÓDULOS",
    tint: "bg-emerald-100 text-emerald-700",
    href: "/dashboard/ventas",
  },
];