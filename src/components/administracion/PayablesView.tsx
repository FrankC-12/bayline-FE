"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import { usePayables } from "@/hooks/usePayables";
import { useAccounts } from "@/hooks/useAccounts";
import { getLatestExchangeRates } from "@/lib/api/concesionario";
import { payPurchase } from "@/lib/api/administracion";
import { createOperationAttempt } from "@/lib/operation-attempt";
import { NumberInput } from "@/components/ui/NumberInput";
import ErrorState from "@/components/common/ErrorState";
import { formatMoney } from "@/lib/format";
import type { Payable } from "@/types/administracion";
const usd=(value:number)=>`$${formatMoney(value)}`;
const today=()=>new Date().toLocaleDateString("en-CA",{timeZone:"America/Caracas"});
const purchaseHref=(id:string)=>`/dashboard/administracion/finanzas/compras/${id}`;
export default function PayablesView() {
 const { currentUser }=useAuth();const filialId=currentUser?.filialId ?? null;
 const { canEdit }=useModuleAccess("finanzas-egreso");
 const { payables,loading,error,refresh }=usePayables(filialId);
 const [paying,setPaying]=useState<Payable | null>(null);
 const total=payables.reduce((sum,p)=>sum+(p.balance_usd ?? p.total_amount),0);
 const day=new Date(`${today()}T12:00:00`);const inSeven=new Date(day);inSeven.setDate(inSeven.getDate()+7);
 const soon=payables.filter(p=>p.due_date && new Date(`${p.due_date}T12:00:00`)>=day && new Date(`${p.due_date}T12:00:00`)<=inSeven).reduce((sum,p)=>sum+(p.balance_usd ?? p.total_amount),0);
 return <div>
  <h1 className="font-display text-3xl font-bold text-navy">Cuentas por pagar</h1><p className="mb-6 mt-2 text-sm text-steel">Se crean al conciliar una compra con su factura. Ordenadas por vencimiento.</p>
  <div className="mb-5 grid gap-3 sm:grid-cols-3">{[{label:"Total por pagar",value:usd(total)},{label:"Vence en los próximos 7 días",value:usd(soon)},{label:"Sin factura registrada",value:`${payables.filter(p=>!p.invoice_number).length} compras`}].map(card=><div key={card.label} className="rounded-2xl border border-navy/10 bg-white p-5"><p className="text-xs text-steel">{card.label}</p><p className="mt-2 text-2xl font-bold">{card.value}</p></div>)}</div>
  {loading ? <p className="p-8 text-steel">Cargando cuentas por pagar…</p> : error ? <ErrorState error={error} onRetry={refresh} /> : <div className="overflow-x-auto rounded-2xl border border-navy/10 bg-white"><table className="w-full text-left text-sm"><thead className="border-b text-xs uppercase text-steel"><tr>{["Compra","Proveedor","Factura","Total","Saldo","Vence",""].map((label,index)=><th key={index} className="px-4 py-3">{label}</th>)}</tr></thead><tbody>{payables.map(p=><tr key={p.purchase_request_id} className="border-b border-navy/5"><td className="p-4"><Link href={purchaseHref(p.purchase_request_id)} className="font-mono text-blue underline">{p.code}</Link></td><td className="p-4 font-semibold">{p.supplier_name}</td><td className={`p-4 ${!p.invoice_number ? "text-amber-700" : ""}`}>{p.invoice_number ? `Fact. ${p.invoice_number}` : "Sin factura"}</td><td className="p-4">{usd(p.total_amount)}</td><td className="p-4 font-bold">{usd(p.balance_usd ?? p.total_amount)}</td><td className="p-4"><span className={`rounded-full px-2 py-1 text-xs ${p.due_date && p.due_date<today() ? "bg-red-100 text-red-700" : "bg-blue-light text-blue"}`}>{p.due_date ? new Date(`${p.due_date}T12:00:00`).toLocaleDateString("es-VE") : "Sin vencimiento"}</span></td><td className="p-4 text-right">{!p.invoice_number ? <Link href={purchaseHref(p.purchase_request_id)} className="whitespace-nowrap rounded-full border px-3 py-2 text-xs font-semibold">Conciliar primero</Link> : canEdit && <button onClick={()=>setPaying(p)} className="whitespace-nowrap rounded-full bg-blue px-4 py-2 text-xs font-semibold text-white">Registrar pago</button>}</td></tr>)}</tbody></table>{!payables.length && <p className="p-8 text-center text-sm text-steel">No hay cuentas por pagar pendientes.</p>}</div>}
  <p className="mt-4 text-xs text-steel">Las compras antiguas sin factura deben conciliarse desde su detalle antes de pagarlas.</p>
  {paying && filialId && <PaymentModal filialId={filialId} payable={paying} onClose={()=>setPaying(null)} onPaid={async()=> {setPaying(null);await refresh();}} />}
 </div>;
}
function PaymentModal({ filialId,payable,onClose,onPaid }: {filialId:string;payable:Payable;onClose:()=>void;onPaid:()=>Promise<void>}) {
 const { accounts }=useAccounts(filialId);
 const [currency,setCurrency]=useState<"usd" | "bs">("usd");const [account,setAccount]=useState("");
 const balance=payable.balance_usd ?? payable.total_amount;
 const [amount,setAmount]=useState(String(balance));const [rate,setRate]=useState("");const [date,setDate]=useState(today);
 const [reference,setReference]=useState("");const [busy,setBusy]=useState(false);const [error,setError]=useState<string | null>(null);
 const attempt=useRef(createOperationAttempt());const lock=useRef(false);
 useEffect(()=> {let active=true;getLatestExchangeRates().then(rows=> {if(active) setRate(String(rows.find(row=>row.currency==="USD")?.rate_ves ?? ""));}).catch(()=>{});return ()=> {active=false;};},[]);
 const equivalent=currency==="usd" ? Number(amount) : Number(rate)>0 ? Number(amount)/Number(rate) : 0;
 const after=Math.max(0,balance-equivalent);
 async function submit() { if(lock.current) return;
  if(!account || !(Number(amount)>0) || (currency==="bs" && !(Number(rate)>0)) || equivalent>balance+0.005) {setError("Selecciona una cuenta y un monto válido que no supere el saldo.");return;}
  lock.current=true;setBusy(true);setError(null);
  try {const input={account_id:account,currency,amount:Number(amount),...(currency==="bs" ? {exchange_rate:Number(rate)} : {}),entry_date:date,reference:reference.trim() || null};await payPurchase(payable.purchase_request_id,{...input,request_id:attempt.current.idFor(input)});attempt.current.reset();await onPaid();} catch(err) {setError(err instanceof Error ? err.message : "No se pudo registrar el pago.");} finally {lock.current=false;setBusy(false);}
 }
 return <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4"><section role="dialog" aria-modal="true" aria-labelledby="purchase-payment-title" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"><header className="mb-5 flex justify-between gap-3"><div><h2 id="purchase-payment-title" className="font-display text-xl font-bold">Registrar pago</h2><p className="mt-1 text-xs text-steel">{payable.code} · {payable.supplier_name} · Factura {payable.invoice_number} · saldo {usd(balance)}</p></div><button aria-label="Cerrar" disabled={busy} onClick={onClose}><X className="h-5 w-5" /></button></header><fieldset disabled={busy} className="space-y-4"><div><p className="mb-2 text-sm font-semibold">Moneda del pago</p>{(["usd","bs"] as const).map(value=><button key={value} type="button" onClick={()=> {setCurrency(value);setAccount("");setAmount(String(value==="bs" ? balance*(Number(rate)||0) : balance));}} className={`rounded-full px-5 py-2 text-sm ${currency===value ? "bg-blue text-white" : "bg-ash text-steel"}`}>{value==="usd" ? "USD" : "Bolívares"}</button>)}</div><label className="block text-sm font-semibold">Cuenta que paga<select value={account} onChange={event=>setAccount(event.target.value)} className="mt-2 w-full rounded-xl border px-3 py-2.5"><option value="">Selecciona una cuenta…</option>{accounts.filter(item=>item.is_active && item.currency===currency).map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label><div className="grid grid-cols-2 gap-3"><label className="text-sm font-semibold">Monto ({currency.toUpperCase()})<NumberInput min={0} step={0.01} value={amount} onValueChange={setAmount} className="mt-2 w-full rounded-xl border px-3 py-2.5" /></label><label className="text-sm font-semibold">Fecha<input type="date" value={date} onChange={event=>setDate(event.target.value)} className="mt-2 w-full rounded-xl border px-3 py-2.5" /></label></div>{currency==="bs" && <label className="block text-sm font-semibold">Tasa BCV (Bs. por USD)<NumberInput min={0.0001} step={0.0001} value={rate} onValueChange={setRate} className="mt-2 w-full rounded-xl border px-3 py-2.5" /><span className="mt-2 block text-xs font-normal text-steel">Equivalente: {usd(equivalent)}</span></label>}<label className="block text-sm font-semibold">Referencia (opcional)<input value={reference} maxLength={60} onChange={event=>setReference(event.target.value)} className="mt-2 w-full rounded-xl border px-3 py-2.5" /></label></fieldset><p className="my-5 flex justify-between border-t pt-4 text-sm">Saldo después del pago <b>{usd(after)}</b></p>{error && <p role="alert" className="mb-3 text-sm text-red-700">{error}</p>}<button disabled={busy || !account} onClick={()=>void submit()} className="w-full rounded-full bg-blue px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Registrando…" : "Registrar pago"}</button></section></div>;
}
