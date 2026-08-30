"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, LayoutGrid, Clock, ArrowLeftRight, Boxes } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard/almacen", label: "Dashboard de Inventario", icon: LayoutGrid },
  { href: "/dashboard/almacen/movimientos", label: "Historial de Movimientos", icon: Clock },
  { href: "/dashboard/almacen/transferencias", label: "Órdenes de Transferencia", icon: ArrowLeftRight },
  { href: "/dashboard/almacen/lotes", label: "Sistema de Lotes", icon: Boxes },
];

export default function AlmacenLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex max-w-7xl gap-8 px-6 py-12">
      <aside className="w-64 shrink-0">
        <Link href="/dashboard" className="mb-4 flex items-center gap-1.5 text-sm font-medium text-steel hover:text-navy">
          <ChevronLeft className="h-4 w-4" />
          Volver al Dashboard
        </Link>
        <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-steel">Almacén</p>
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
                  active ? "bg-blue-light text-blue" : "text-steel hover:bg-ash hover:text-navy"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}