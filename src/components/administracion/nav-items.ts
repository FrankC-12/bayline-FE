import { ShoppingCart, Package, AlertCircle, LineChart, CreditCard, ArrowUp, ArrowDown, TrendingUp } from "lucide-react";

export const ADMIN_ITEMS = [
  { href: "/dashboard/administracion", label: "Compras a Proveedores", tab: null },
  { href: "/dashboard/administracion?tab=proveedores", label: "Proveedores", tab: "proveedores" },
  { href: "/dashboard/administracion/reclamos", label: "Reclamos a Proveedor", tab: null, standalone: true },
];

export const ADMIN_ICONS = [ShoppingCart, Package, AlertCircle];

export const FINANCE_ITEMS = [
  { href: "/dashboard/administracion/finanzas", label: "Dashboard", icon: LineChart },
  { href: "/dashboard/administracion/finanzas/cuentas", label: "Cuentas", icon: CreditCard },
  { href: "/dashboard/administracion/finanzas/ingresos", label: "Ingresos", icon: ArrowUp },
  { href: "/dashboard/administracion/finanzas/egresos", label: "Egresos", icon: ArrowDown },
  { href: "/dashboard/administracion/finanzas/rentabilidad", label: "Rentabilidad", icon: TrendingUp },
];
