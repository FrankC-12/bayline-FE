import { ShoppingCart, Package, AlertCircle, Truck } from "lucide-react";

export const COMPRAS_ITEMS = [
  { href: "/dashboard/compras", label: "Compras a Proveedores", tab: null },
  { href: "/dashboard/compras?tab=proveedores", label: "Proveedores", tab: "proveedores" },
  { href: "/dashboard/compras/reclamos", label: "Reclamos a Proveedor", tab: null, standalone: true },
  { href: "/dashboard/compras/vehiculos", label: "Compra de Vehículos", tab: null, standalone: true },
];

export const COMPRAS_ICONS = [ShoppingCart, Package, AlertCircle, Truck];
