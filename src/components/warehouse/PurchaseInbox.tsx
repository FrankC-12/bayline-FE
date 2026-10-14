"use client";
import Link from "next/link";
import { useWarehouseScope } from "@/contexts/WarehouseContext";
import { useListLoader } from "@/hooks/useListLoader";
import { listPurchaseRequests } from "@/lib/api/administracion";
import ErrorState from "@/components/common/ErrorState";
import type { PurchaseRequest } from "@/types/administracion";
export default function PurchaseInbox() {
 const { filialId }=useWarehouseScope();
 const { data,loading,error,refresh }=useListLoader<PurchaseRequest>(()=>filialId ? listPurchaseRequests(filialId) : Promise.resolve([]),[filialId]);
 const pending=data.filter(item=>["enviada","cotizada","pagada"].includes(item.status));
 return <div><h1 className="font-display text-3xl font-bold">Recepción de compras</h1><p className="my-4 text-sm text-steel">Recibe mercancía por línea y crea sus lotes FIFO. La compra queda abierta hasta recibir todo.</p>{loading ? <p>Cargando compras…</p> : error ? <ErrorState error={error} onRetry={refresh} /> : <div className="space-y-3">{pending.map(item=><Link key={item.id} href={`/dashboard/almacen/compras/${item.id}`} className="flex justify-between gap-3 rounded-2xl border border-navy/10 bg-white p-5"><span className="font-mono font-semibold text-blue">{item.code}</span><span className="text-sm text-steel">{item.lines.reduce((sum,line)=>sum+Math.max(0,line.quantity-line.received_quantity),0)} unidades pendientes →</span></Link>)}{!pending.length && <p className="rounded-xl bg-white p-8 text-center text-sm text-steel">No hay compras pendientes de recepción.</p>}</div>}</div>;
}
