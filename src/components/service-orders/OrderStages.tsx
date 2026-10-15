import { Check } from "lucide-react";
const LABELS=["Inspección preliminar","Tareas asignadas","Vehículo y repuestos recibidos","Inspección minuciosa","Realización de tareas","Facturación y cobro","Entrega"];
export default function OrderStages({complete,cancelled}:{complete:boolean[];cancelled:boolean}) {
 const current=complete.findIndex(value=>!value);
 return <nav aria-label="Etapas de la ODS" className="mt-5 border-t border-navy/10 pt-5"><ol className="grid grid-cols-2 gap-y-4 sm:grid-cols-4 xl:grid-cols-7">{LABELS.map((label,index)=> {
 const done=complete[index];const active=!cancelled && index===current;
 return <li key={label} aria-current={active ? "step" : undefined} className="relative flex flex-col items-center gap-2 px-1 text-center"><span aria-hidden="true" className={`absolute left-0 right-0 top-3 h-px ${done ? "bg-emerald-400" : "bg-navy/15"}`}/><span className={`relative flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-semibold ${done ? "border-emerald-600 bg-emerald-600 text-white" : active ? "border-blue bg-white text-blue ring-4 ring-blue-light" : "border-navy/15 bg-white text-steel"}`}>{done ? <Check aria-hidden="true" className="h-3.5 w-3.5"/> : index+1}</span><span className={`text-[10px] leading-relaxed ${done ? "font-semibold text-emerald-800" : active ? "font-bold text-navy" : "text-steel"}`}>{label}<span className="sr-only">: {done ? "completada" : active ? "actual" : "pendiente"}</span></span></li>;
 })}</ol></nav>;
}
