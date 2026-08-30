"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ShoppingCart, Undo2 } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard/repuestos", label: "Catálogo de Repuestos", icon: ShoppingCart },
  { href: "/dashboard/repuestos/ventas", label: "Ventas de Repuestos", icon: ShoppingCart },
  { href: "/dashboard/repuestos/devoluciones", label: "Devolución de Repuestos", icon: Undo2 },
];

export default function PartsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex max-w-7xl gap-8 px-6 py-12">
      <aside className="w-64 shrink-0">
        <Link href="/dashboard" className="mb-4 flex items-center gap-1.5 text-sm font-medium text-steel hover:text-navy">
          <ChevronLeft className="h-4 w-4" />
          Volver al Dashboard
        </Link>
        <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-steel">Repuestos</p>
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