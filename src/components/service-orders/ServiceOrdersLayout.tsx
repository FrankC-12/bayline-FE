"use client";

import {useCallback,useEffect,useState} from "react";
import {useAuth} from "@/contexts/AuthContext";
import {getClaimsOverview} from "@/lib/api/warrantyClaims";
import { formatCount } from "@/lib/format";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronDown } from "lucide-react";
import { UpsellsProvider, useUpsellsContext } from "@/contexts/UpsellsContext";
import { NAV_ITEMS, ORDER_NAV_ITEMS } from "./nav-items";

export default function ServiceOrdersLayout({ children }: { children: React.ReactNode }) {
  return (
    <UpsellsProvider>
      <ServiceOrdersLayoutContent>{children}</ServiceOrdersLayoutContent>
    </UpsellsProvider>
  );
}

function ServiceOrdersLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {currentUser}=useAuth();
  const [claimCount,setClaimCount]=useState(0);
  const updateClaims=useCallback(()=>{if(currentUser?.filialId)void getClaimsOverview(currentUser.filialId).then(v=>setClaimCount(v.pending)).catch(()=>undefined);},[currentUser?.filialId]);
  useEffect(()=>{updateClaims();window.addEventListener("bayline:claims-updated",updateClaims);const timer=setInterval(updateClaims,30000);return()=>{clearInterval(timer);window.removeEventListener("bayline:claims-updated",updateClaims);};},[updateClaims,pathname]);
  const { upsells } = useUpsellsContext();
  const pendingCount = upsells.filter((u) => u.status === "pendiente").length;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-stretch gap-4 px-4 lg:flex-row lg:items-start lg:gap-8 lg:px-6">
      <aside className="min-w-0 shrink-0 pt-6 lg:w-60 lg:py-12">
        <Link href="/dashboard" className="mb-4 flex items-center gap-1.5 text-sm font-medium text-steel hover:text-navy">
          <ChevronLeft className="h-4 w-4" />
          Volver al Dashboard
        </Link>
        <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-steel">
          Asesor de Servicios
        </p>
        <nav aria-label="Navegación de servicios" className="flex gap-2 overflow-x-auto pb-2 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
          {NAV_ITEMS.filter(item=>item.href !== "/dashboard/servicios/historial").map((item) => {
            const isOrderDetail = pathname.startsWith("/dashboard/servicios/") &&
              !NAV_ITEMS.some(navItem => navItem.href !== "/dashboard/servicios" &&
                (pathname === navItem.href || pathname.startsWith(`${navItem.href}/`)));
            const active = pathname === item.href || (item.href === "/dashboard/servicios" && isOrderDetail);
            const Icon = item.icon;
            if(item.href === "/dashboard/servicios") {
              const inOrders = active || pathname === "/dashboard/servicios/historial";
              return <details key={`${item.href}:${pathname}`} open={inOrders} className="group min-w-[220px] shrink-0 lg:min-w-0">
                <summary className={`flex cursor-pointer list-none items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-blue [&::-webkit-details-marker]:hidden ${inOrders ? "bg-blue-light text-blue" : "text-steel hover:bg-ash hover:text-navy"}`}>
                  {Icon && <Icon aria-hidden="true" className="h-4 w-4 shrink-0"/>}<span className="flex-1">Órdenes de Servicio</span><ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180"/>
                </summary>
                <div className="ml-5 mt-1 space-y-1 border-l border-navy/10 pl-2" aria-label="Opciones de órdenes de servicio">
                  {ORDER_NAV_ITEMS.map(child=> {
                    const selected=pathname === child.href || (child.href === "/dashboard/servicios" && isOrderDetail);
                    return <Link key={child.href} href={child.href} aria-current={selected ? "page" : undefined} className={`block whitespace-nowrap rounded-lg px-3 py-2 text-sm ${selected ? "bg-white font-semibold text-blue" : "text-steel hover:bg-white hover:text-navy"}`}>{child.label}</Link>;
                  })}
                </div>
              </details>;
            }
            const badgeCount=item.href === "/dashboard/servicios/garantias"?claimCount:item.href === "/dashboard/servicios/upsells"?pendingCount:0;
            const showBadge=badgeCount>0;
            return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition ${active ? "bg-blue-light text-blue" : "text-steel hover:bg-ash hover:text-navy"}`}>
              {Icon && <Icon aria-hidden="true" className="h-4 w-4 shrink-0"/>}<span className="flex-1">{item.label}</span>
              {showBadge && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">{formatCount(badgeCount)}</span>}
            </Link>;
          })}
        </nav>
      </aside>

      <div className="min-w-0 w-full pb-8 pt-2 lg:flex-1 lg:py-12" role="region" aria-label="Contenido de servicios">{children}</div>
    </div>
  );
}