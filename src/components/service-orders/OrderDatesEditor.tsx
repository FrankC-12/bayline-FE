"use client";
import { useState } from "react";
import { CalendarClock } from "lucide-react";
import { calendarDate, calendarTimestamp, CALENDAR_TIME_ZONE } from "@/lib/calendar";
import type { ServiceOrder } from "@/types/serviceOrder";
import type { UpdateServiceOrderInput } from "@/lib/api/serviceOrders";

const timeOf = (iso: string | null) => iso ? new Intl.DateTimeFormat("en-GB", { timeZone: CALENDAR_TIME_ZONE, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(iso)) : "";
export default function OrderDatesEditor({ order, disabled, onSave }: { order: ServiceOrder; disabled: boolean; onSave: (input: UpdateServiceOrderInput) => Promise<unknown> }) {
 const [startDate,setStartDate]=useState(order.scheduled_at ? calendarDate(order.scheduled_at) : "");
 const [startTime,setStartTime]=useState(timeOf(order.scheduled_at));
 const [deliveryDate,setDeliveryDate]=useState(order.promised_at ? calendarDate(order.promised_at) : "");
 const [deliveryTime,setDeliveryTime]=useState(timeOf(order.promised_at));
 const [busy,setBusy]=useState(false); const [error,setError]=useState<string | null>(null); const [saved,setSaved]=useState(false);
 async function submit(event: React.FormEvent) {
  event.preventDefault(); if(busy || disabled) return;setError(null);setSaved(false);
  if (!!startDate !== !!startTime || !!deliveryDate !== !!deliveryTime) {setError("Completa fecha y hora de cada campo, o deja la entrega vacía.");return;}
  setBusy(true);try {await onSave({...startDate && startTime ? {scheduled_at:calendarTimestamp(startDate,startTime)} : {},...deliveryDate && deliveryTime ? {promised_at:calendarTimestamp(deliveryDate,deliveryTime)} : {clear_promised_at:true}});setSaved(true);}catch(e){setError(e instanceof Error ? e.message : "No se pudieron guardar las fechas.");}finally{setBusy(false);}
 }
 if(disabled) return null;
 return <details className="mt-4 rounded-xl border border-navy/10 bg-white"><summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-blue">Editar agenda y entrega prometida</summary><form onSubmit={submit} className="space-y-4 border-t border-navy/10 p-4"><p className="flex items-center gap-2 text-xs text-steel"><CalendarClock aria-hidden="true" className="h-4 w-4"/>Todas las horas corresponden a Caracas. El inicio de la visita y la entrega son independientes.</p><div className="grid gap-4 sm:grid-cols-2">{[{label:"Inicio de visita",date:startDate,time:startTime,setDate:setStartDate,setTime:setStartTime},{label:"Entrega prometida",date:deliveryDate,time:deliveryTime,setDate:setDeliveryDate,setTime:setDeliveryTime}].map(field=><fieldset key={field.label} disabled={busy}><legend className="mb-2 text-xs font-semibold text-navy">{field.label}</legend><div className="grid grid-cols-2 gap-2"><input aria-label={`Fecha: ${field.label}`} type="date" value={field.date} onChange={e=>field.setDate(e.target.value)} className="min-w-0 rounded-lg border border-navy/15 px-2 py-2 text-sm"/><input aria-label={`Hora: ${field.label}`} type="time" value={field.time} onChange={e=>field.setTime(e.target.value)} className="min-w-0 rounded-lg border border-navy/15 px-2 py-2 text-sm"/></div></fieldset>)}</div><div className="flex flex-wrap items-center gap-3"><button type="button" disabled={busy} onClick={()=>{setDeliveryDate("");setDeliveryTime("");setSaved(false);}} className="text-xs font-semibold text-steel">Quitar entrega prometida</button><button disabled={busy} type="submit" className="ml-auto rounded-full bg-blue px-4 py-2 text-xs font-semibold text-white">{busy ? "Guardando…" : "Guardar fechas"}</button></div>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}{saved && <p role="status" className="text-sm text-emerald-700">Fechas actualizadas.</p>}</form></details>;
}
