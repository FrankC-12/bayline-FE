"use client";
import { useRef, useState } from "react";
import { useUpsellsContext } from "@/contexts/UpsellsContext";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import Modal from "@/components/common/Modal";
import { formatMoney } from "@/lib/format";
import type { Upsell, UpsellApprovalChannel } from "@/types/upsells";
export default function OrderFindings({orderId,readOnly,onApplied}:{orderId:string;readOnly:boolean;onApplied:()=>Promise<void>}) {
 const {upsells,decide,refresh,error}=useUpsellsContext();
 useAutoRefresh(refresh);
 const findings=upsells.filter(u=>u.service_order_id===orderId);
 const [selected,setSelected]=useState<{finding:Upsell;status:"aprobado"|"pospuesto"|"rechazado"}|null>(null);
 const [channel,setChannel]=useState<UpsellApprovalChannel>("presencial");
 const [busy,setBusy]=useState(false);const lock=useRef(false);
 const [actionError,setError]=useState<string|null>(null);
 async function confirm() {
  if(!selected || readOnly || lock.current) return;
  lock.current=true;setBusy(true);setError(null);
  try {await decide(selected.finding.id,{status:selected.status,...selected.status==="aprobado" ? {approval_channel:channel,target_service_order_id:orderId} : selected.status==="rechazado" ? {discard_reason:"cliente_no_lo_quiere" as const} : {}});setSelected(null);await onApplied();}
  catch(e){setError(e instanceof Error ? e.message : "No se pudo registrar la decisión.");}
  finally {lock.current=false;setBusy(false);}
 }
 if(error) return <p role="alert" className="mt-3 text-xs text-red-700">No se pudieron consultar los hallazgos. <button onClick={()=>void refresh()} className="underline">Reintentar</button></p>;
 if(!findings.length) return null;
 return <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3"><h3 className="mb-3 text-xs font-semibold text-amber-900">Hallazgos del técnico · preguntar al cliente</h3><ul className="space-y-3">{findings.map(finding=><li key={finding.id}><div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0 flex-1"><p className="text-xs font-semibold text-navy">{finding.title} <span className="font-normal">· ${formatMoney(finding.amount,2)}</span></p><p className="mt-1 whitespace-pre-wrap text-[11px] text-amber-900">{finding.description}</p>{finding.photo_urls.length>0 && <div className="mt-2 flex flex-wrap gap-2">{finding.photo_urls.map((url,i)=><a key={url} href={url} target="_blank" rel="noreferrer" className="text-[11px] text-blue underline">Foto {i+1}</a>)}</div>}</div><div className="flex flex-wrap gap-1">{[{label:"Sí",status:"aprobado"},{label:"Después",status:"pospuesto"},{label:"No",status:"rechazado"}].map(option=><button key={option.status} type="button" disabled={readOnly || busy || finding.status === "aprobado" || finding.status === "rechazado" || finding.status===option.status} aria-label={`${option.label}: ${finding.title}`} aria-pressed={finding.status===option.status} onClick={()=>{setSelected({finding,status:option.status as "aprobado"|"pospuesto"|"rechazado"});setError(null);}} className={`rounded-full border px-2.5 py-1.5 text-[11px] disabled:opacity-60 ${finding.status===option.status ? "border-blue bg-blue text-white" : "border-navy/15 bg-white text-navy hover:border-blue"}`}>{option.label}</button>)}</div></div></li>)}</ul>
 <Modal open={!!selected} onClose={()=>setSelected(null)} title={selected?.status === "aprobado" ? "Aceptar trabajo adicional" : selected?.status === "pospuesto" ? "Dejar para después" : "Archivar hallazgo"} closeDisabled={busy} size="md" footer={<><button disabled={busy} onClick={()=>setSelected(null)} className="rounded-full border border-navy/15 px-4 py-2 text-sm">Cancelar</button><button disabled={busy} onClick={()=>void confirm()} className="rounded-full bg-blue px-4 py-2 text-sm font-semibold text-white">{busy ? "Guardando…" : "Confirmar decisión"}</button></>}><div className="p-5 sm:p-7"><p className="text-sm font-semibold text-navy">{selected?.finding.title}</p><p className="mt-3 text-sm text-steel">{selected?.status === "aprobado" ? "Se agregarán las tareas y los repuestos a esta orden con sus precios vigentes." : selected?.status === "pospuesto" ? "Quedará como servicio pendiente en la ficha del vehículo." : "Se archivará porque el cliente no desea realizarlo."}</p>{selected?.status === "aprobado" && <label className="mt-4 block text-sm text-navy">Medio de aprobación<select aria-label="Medio de aprobación" value={channel} onChange={e=>setChannel(e.target.value as UpsellApprovalChannel)} disabled={busy} className="mt-2 w-full rounded-lg border border-navy/15 p-2">{[{value:"presencial",label:"Presencial"},{value:"whatsapp",label:"WhatsApp"},{value:"llamada",label:"Llamada"},{value:"sms",label:"SMS"},{value:"correo",label:"Correo"}].map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></label>}{actionError && <p role="alert" className="mt-3 text-sm text-red-700">{actionError}</p>}</div></Modal>
 </div>;
}
