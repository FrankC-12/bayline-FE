"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, CalendarClock, CarFront, Clock, UserRound } from "lucide-react";
import { CALENDAR_TIME_ZONE } from "@/lib/calendar";
import { formatElapsed, serviceOrderStoppedAt } from "@/lib/time";
import type { ServiceOrder } from "@/types/serviceOrder";
import type { VehicleLookupEntry } from "@/hooks/useVehicleLookUp";
import LiveDot from "@/components/common/LiveDot";

interface OrderCardProps {
  order: ServiceOrder;
  info: VehicleLookupEntry | undefined;
  technicianName: string;
}

export default function OrderCard({ order, info, technicianName }: OrderCardProps) {
  const overdue = order.status !== "completado" && !!order.promised_at && new Date(order.promised_at).getTime() < Date.now();
  const stoppedAt = serviceOrderStoppedAt(order);
  const [elapsed, setElapsed] = useState(() => formatElapsed(order.created_at, stoppedAt));

  useEffect(() => {
    if (stoppedAt) {
      setElapsed(formatElapsed(order.created_at, stoppedAt));
      return;
    }
    setElapsed(formatElapsed(order.created_at));
    const interval = setInterval(() => setElapsed(formatElapsed(order.created_at)), 1000);
    return () => clearInterval(interval);
  }, [order.created_at, stoppedAt]);

  const accent = overdue ? "border-t-red-400" : order.status === "completado" ? "border-t-emerald-400" : order.status === "pendiente" ? "border-t-amber-400" : "border-t-blue";
  return (
    <article className={`group min-w-0 rounded-2xl border border-t-[3px] border-navy/10 ${accent} bg-white p-4 shadow-sm transition duration-200 hover:border-blue/30 hover:shadow-md motion-reduce:transition-none sm:p-5`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-xs font-bold tracking-wide text-blue">{order.code}</span>
        <span className="max-w-full rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-steel">{order.order_type.name}</span>
      </div>
      <div className="mt-4 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-light/60 text-blue"><CarFront aria-hidden="true" className="h-5 w-5" /></span>
        <div className="min-w-0"><h3 className="break-words font-display text-base font-bold leading-snug text-navy">{info ? `${info.vehicle.brand} ${info.vehicle.model}` : "Vehículo"}</h3><p className="mt-1 font-mono text-xs font-semibold tracking-wide text-steel">{info?.vehicle.plate || "Sin placa"}</p></div>
      </div>
      <p className="mt-3 break-words text-sm text-steel">{info?.client.full_name ?? "Cliente"}</p>
      <div className="mt-4 space-y-2">
        {!order.technician_user_id && <p className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800"><UserRound aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />Por asignar técnico</p>}
        {order.promised_at && <div className={`flex items-start gap-2 rounded-lg px-3 py-2 ${overdue ? "bg-red-50 text-red-700" : "bg-slate-50 text-steel"}`}><CalendarClock aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" /><div><p className="text-[10px] font-semibold uppercase tracking-wide">{overdue ? "Promesa vencida" : "Entrega prometida"}</p><p className="mt-0.5 text-xs">{new Date(order.promised_at).toLocaleString("es-VE", { timeZone: CALENDAR_TIME_ZONE,day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}</p></div></div>}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-navy/5 pt-3 text-xs text-steel">
        <span className="flex min-w-0 items-center gap-1.5"><UserRound aria-hidden="true" className="h-3.5 w-3.5 shrink-0" /><span className="break-words">{technicianName || (order.technician_user_id ? "Técnico asignado" : "Sin asignar")}</span></span>
        <span title="Tiempo transcurrido de la ODS" className="flex items-center gap-1.5 whitespace-nowrap font-mono text-[11px]">{!stoppedAt && <LiveDot />}<Clock aria-hidden="true" className="h-3 w-3" />{elapsed}</span>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 rounded-xl bg-blue-light/40 px-3 py-2.5 text-xs font-semibold text-blue"><span>{order.status === "completado" ? order.invoiced_at ? "Revisar cobro y cierre" : "Revisar y facturar" : !order.technician_user_id ? "Asignar técnico" : "Ver tareas y repuestos"}</span><ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none" /></div>
    </article>
  );
}
