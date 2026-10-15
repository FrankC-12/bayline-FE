"use client";
import { listReceivables, type Receivable } from "@/lib/api/serviceOrderBilling";
import { useListLoader } from "./useListLoader";
export function useOrderPaymentStatus(orderId:string,filialId:string|null,invoiced:boolean) {
 const list=useListLoader<Receivable>(()=>invoiced && filialId ? listReceivables(filialId) : Promise.resolve([]),[orderId,filialId,invoiced],invoiced ? 15000 : 0);
 const settled=invoiced && !list.loading && !list.error && !list.data.some(row=>row.service_order_id===orderId && row.pending_amount>0);
 return {settled,refresh:list.refresh};
}
