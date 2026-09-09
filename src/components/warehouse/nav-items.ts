import { ArrowLeftRight, Boxes, Clock, LayoutGrid } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/dashboard/almacen", label: "Dashboard de Inventario", icon: LayoutGrid },
  { href: "/dashboard/almacen/movimientos", label: "Historial de Movimientos", icon: Clock },
  { href: "/dashboard/almacen/transferencias", label: "Órdenes de Transferencia", icon: ArrowLeftRight },
  { href: "/dashboard/almacen/lotes", label: "Sistema de Lotes", icon: Boxes },
];
