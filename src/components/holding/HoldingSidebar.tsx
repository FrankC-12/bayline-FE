"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  PackageCheck,
  ShoppingCart,
  Car,
  Contact,
  Users,
  Warehouse,
  Building2,
  Receipt,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const NAV_ITEMS = [
  { href: "/holding", label: "Resumen", icon: LayoutDashboard },
  { href: "/holding/ods", label: "Órdenes de Servicio", icon: FileText },
  { href: "/holding/odt", label: "Despachos (ODT)", icon: PackageCheck },
  { href: "/holding/ventas-repuestos", label: "Ventas de Repuestos", icon: ShoppingCart },
  { href: "/holding/ventas-vehiculos", label: "Ventas de Vehículos", icon: Car },
  { href: "/holding/clientes", label: "Clientes", icon: Contact },
  { href: "/holding/usuarios", label: "Usuarios", icon: Users },
  { href: "/holding/almacenes", label: "Almacenes", icon: Warehouse },
  { href: "/holding/filiales", label: "Filiales", icon: Building2 },
  { href: "/holding/garantias-consolidado", label: "Garantías Consolidado", icon: Receipt },
];

export default function HoldingSidebar() {
  const pathname = usePathname();
  const { currentUser } = useAuth();

  return (
    <div>
      <p className="mb-1 font-mono text-[11px] uppercase tracking-widest text-steel">Holding</p>
      <p className="mb-6 truncate font-display text-lg font-bold text-navy">
        Hola, {currentUser?.fullName || currentUser?.email}
      </p>
      <nav className="space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
                active ? "bg-blue-light text-blue" : "text-steel hover:bg-ash hover:text-navy"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
