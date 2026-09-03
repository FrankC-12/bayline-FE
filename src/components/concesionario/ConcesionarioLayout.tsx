"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, LayoutGrid, TrendingUp } from "lucide-react";
import ExchangeRateCard from "./ExchangeRateCard";

const NAV_ITEMS = [
  { href: "/dashboard/concesionario", label: "Catálogo de Vehículos", icon: LayoutGrid },
  { href: "/dashboard/concesionario/ventas", label: "Ventas de Vehículos", icon: TrendingUp },
];

export default function ConcesionarioLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex max-w-7xl gap-8 px-6 py-12">
      <aside className="w-64 shrink-0">
        <Link href="/dashboard" className="mb-4 flex items-center gap-1.5 text-sm font-medium text-steel hover:text-navy">
          <ChevronLeft className="h-4 w-4" />
          Volver al Dashboard
        </Link>
        <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-steel">Concesionario</p>
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
        <ExchangeRateCard />
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
