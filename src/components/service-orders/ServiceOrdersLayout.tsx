"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUpsells } from "@/hooks/useUpsells";
import { NAV_ITEMS } from "./nav-items";

export default function ServiceOrdersLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentUser } = useAuth();
  const { upsells } = useUpsells(currentUser?.filialId ?? null);
  const pendingCount = upsells.filter((u) => u.status === "pendiente").length;

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 gap-8 overflow-hidden px-6">
      <aside className="w-64 shrink-0 overflow-y-auto overscroll-contain py-12">
        <Link href="/dashboard" className="mb-4 flex items-center gap-1.5 text-sm font-medium text-steel hover:text-navy">
          <ChevronLeft className="h-4 w-4" />
          Volver al Dashboard
        </Link>
        <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-steel">
          Asesor de Servicios
        </p>
        <nav className="space-y-1">
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
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
                  item.indent ? "ml-6" : ""
                } ${active ? "bg-blue-light text-blue" : "text-steel hover:bg-ash hover:text-navy"}`}
              >
                {Icon && <Icon className="h-4 w-4" />}
                <span className="flex-1">{item.label}</span>
                {showBadge && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                    {pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain py-12 pr-2" role="region" aria-label="Contenido de servicios" tabIndex={0}>{children}</div>
    </div>
  );
}