import { FileStack, LineChart, CreditCard, ArrowUp, ArrowDown, TrendingUp, Receipt } from "lucide-react";

// Proveedores / Compras a Proveedores / Reclamos a Proveedor moved to their
// own "Compras" module — see src/components/compras/nav-items.ts.
export const ADMIN_ITEMS = [
  { href: "/dashboard/administracion/presentaciones", label: "Presentación de Garantías", tab: null, standalone: true },
];

export const ADMIN_ICONS = [FileStack];

export const FINANCE_ITEMS = [
  { href: "/dashboard/administracion/finanzas", label: "Dashboard", icon: LineChart },
  { href: "/dashboard/administracion/finanzas/cuentas", label: "Cuentas", icon: CreditCard },
  { href: "/dashboard/administracion/finanzas/ingresos", label: "Ingresos", icon: ArrowUp },
  { href: "/dashboard/administracion/finanzas/egresos", label: "Egresos", icon: ArrowDown },
  { href: "/dashboard/administracion/finanzas/cuentas-por-cobrar", label: "Cuentas por Cobrar", icon: Receipt },
  { href: "/dashboard/administracion/finanzas/rentabilidad", label: "Rentabilidad", icon: TrendingUp },
];
