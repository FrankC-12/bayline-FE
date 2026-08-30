"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ShoppingCart,
  Package,
  AlertCircle,
  LineChart,
  CreditCard,
  ArrowUp,
  ArrowDown,
  TrendingUp,
} from "lucide-react";

const ADMIN_ITEMS = [
  { href: "/dashboard/administracion", label: "Compras a Proveedores", tab: null },
  { href: "/dashboard/administracion?tab=proveedores", label: "Proveedores", tab: "proveedores" },
  { href: "/dashboard/administracion/reclamos", label: "Reclamos a Proveedor", tab: null, standalone: true },
];

const ADMIN_ICONS = [ShoppingCart, Package, AlertCircle];

const FINANCE_ITEMS = [
  { href: "/dashboard/administracion/finanzas", label: "Dashboard", icon: LineChart },
  { href: "/dashboard/administracion/finanzas/cuentas", label: "Cuentas", icon: CreditCard },
  { href: "/dashboard/administracion/finanzas/ingresos", label: "Ingresos", icon: ArrowUp },
  { href: "/dashboard/administracion/finanzas/egresos", label: "Egresos", icon: ArrowDown },
  { href: "/dashboard/administracion/finanzas/rentabilidad", label: "Rentabilidad", icon: TrendingUp },
];

export default function AdministracionLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab");

  return (
    <div className="mx-auto flex max-w-7xl gap-8 px-6 py-12">
      <aside className="w-64 shrink-0 space-y-6">
        <Link
          href="/dashboard"
          className="mb-2 flex items-center gap-1.5 text-sm font-medium text-steel hover:text-navy"
        >
          <ChevronLeft className="h-4 w-4" />
          Volver al Dashboard
        </Link>

        <div>
          <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-steel">Administración</p>
          <nav className="space-y-1">
            {ADMIN_ITEMS.map((item, i) => {
              const Icon = ADMIN_ICONS[i];
              const isPurchasesPath = pathname === "/dashboard/administracion";
              const active = item.standalone
                ? pathname === item.href
                : isPurchasesPath && currentTab === item.tab;
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
        </div>

        <div>
          <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-steel">Finanzas</p>
          <nav className="space-y-1">
            {FINANCE_ITEMS.map((item) => {
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
        </div>
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}