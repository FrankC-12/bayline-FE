"use client";

import { formatCount } from "@/lib/format";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { UpsellsProvider, useUpsellsContext } from "@/contexts/UpsellsContext";
import { NAV_ITEMS } from "./nav-items";

export default function ServiceOrdersLayout({ children }: { children: React.ReactNode }) {
  return (
    <UpsellsProvider>
      <ServiceOrdersLayoutContent>{children}</ServiceOrdersLayoutContent>
    </UpsellsProvider>
  );
}

function ServiceOrdersLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { upsells } = useUpsellsContext();
  const pendingCount = upsells.filter((u) => u.status === "pendiente").length;

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-4 overflow-y-auto px-4 lg:flex-row lg:gap-8 lg:overflow-hidden lg:px-6">
      <aside className="min-w-0 shrink-0 pt-6 lg:w-60 lg:overflow-y-auto lg:overscroll-contain lg:py-12">
        <Link href="/dashboard" className="mb-4 flex items-center gap-1.5 text-sm font-medium text-steel hover:text-navy">
          <ChevronLeft className="h-4 w-4" />
          Volver al Dashboard
        </Link>
        <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-steel">
          Asesor de Servicios
        </p>
        <nav aria-label="Navegación de servicios" className="flex gap-2 overflow-x-auto pb-2 lg:block lg:space-y-1 lg:pb-0">
          {NAV_ITEMS.map((item) => {
            const isOrderDetail = pathname.startsWith("/dashboard/servicios/") &&
              !NAV_ITEMS.some((navItem) => navItem.href !== "/dashboard/servicios" &&
                (pathname === navItem.href || pathname.startsWith(`${navItem.href}/`)));
            const active = pathname === item.href ||
              (item.href === "/dashboard/servicios" && isOrderDetail);
            const Icon = item.icon;
            const showBadge = item.href === "/dashboard/servicios/upsells" && pendingCount > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition ${
                  item.indent ? "lg:ml-6" : ""
                } ${active ? "bg-blue-light text-blue" : "text-steel hover:bg-ash hover:text-navy"}`}
              >
                {Icon && <Icon className="h-4 w-4" />}
                <span className="flex-1">{item.label}</span>
                {showBadge && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                    {formatCount(pendingCount)}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="min-w-0 shrink-0 pb-8 pt-2 lg:min-h-0 lg:flex-1 lg:shrink lg:overflow-y-auto lg:overscroll-contain lg:py-12 lg:pr-2" role="region" aria-label="Contenido de servicios" tabIndex={0}>{children}</div>
    </div>
  );
}