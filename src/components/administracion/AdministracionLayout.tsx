"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { ADMIN_ITEMS, ADMIN_ICONS, FINANCE_ITEMS } from "./nav-items";

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