import type { Part,PartSale } from "@/types/parts";
import type { DealershipVehicle,VehicleSale } from "@/types/concesionario";
export interface RankedProduct {id:string;name:string;code:string;units:number;amount:number;stock:number|null;minStock:number}
export interface RankedClient {key:string;name:string;purchases:number;amount:number}
export interface SalesInsights {count:number;total:number;average:number;units:number;clients:number;repeatClients:number;products:RankedProduct[];topClients:RankedClient[]}
const number=(value:number)=>Number.isFinite(Number(value)) ? Number(value) : 0;
function customers(rows:{client_name:string;client_document:string|null;amount:number}[]) {
 const grouped=new Map<string,RankedClient>();
 for(const row of rows) {
  const document=row.client_document?.trim().replace(/[\s.-]/g,"").toLocaleUpperCase("es");
  const key=document ? `document:${document}` : `name:${row.client_name.trim().toLocaleLowerCase("es")}`;
  const entry=grouped.get(key) ?? {key,name:row.client_name,purchases:0,amount:0};entry.purchases++;entry.amount+=number(row.amount);grouped.set(key,entry);
 }
 return Array.from(grouped.values()).sort((a,b)=>b.amount-a.amount || b.purchases-a.purchases || a.name.localeCompare(b.name));
}
export function partSalesInsights(sales:PartSale[],parts:Part[]):SalesInsights {
 const completed=sales.filter(s=>s.status==="completado");
 const clients=customers(completed.map(s=>({...s,amount:s.total_with_taxes})));
 const catalog=new Map(parts.map(p=>[p.id,p]));const products=new Map<string,RankedProduct>();
 for(const sale of completed) for(const line of sale.lines) {
  const part=catalog.get(line.part_id);
  const entry=products.get(line.part_id) ?? {id:line.part_id,name:part?.name ?? "Repuesto fuera del catálogo",code:part?.code ?? "",units:0,amount:0,stock:part?.stock_total ?? null,minStock:part?.min_stock ?? 0};
  entry.units+=number(line.dispatched_quantity ?? line.quantity);entry.amount+=number(line.line_total);products.set(entry.id,entry);
 }
 const total=completed.reduce((sum,s)=>sum+number(s.total_with_taxes),0);
 return {count:completed.length,total,average:completed.length ? total/completed.length : 0,units:Array.from(products.values()).reduce((sum,p)=>sum+p.units,0),clients:clients.length,repeatClients:clients.filter(c=>c.purchases>1).length,products:Array.from(products.values()).sort((a,b)=>b.units-a.units || b.amount-a.amount || a.name.localeCompare(b.name)),topClients:clients};
}
export function vehicleSalesInsights(sales:VehicleSale[],vehicles:DealershipVehicle[]):SalesInsights {
 const clients=customers(sales.map(s=>({...s,amount:s.final_price})));const catalog=new Map(vehicles.map(v=>[v.id,v]));const products=new Map<string,RankedProduct>();
 for(const sale of sales) {const vehicle=catalog.get(sale.vehicle_id);const name=vehicle ? `${vehicle.brand} ${vehicle.model}` : "Vehículo fuera del catálogo";const key=name.toLocaleLowerCase("es");const entry=products.get(key) ?? {id:key,name,code:"",units:0,amount:0,stock:null,minStock:0};entry.units++;entry.amount+=number(sale.final_price);products.set(key,entry);}
 const total=sales.reduce((sum,s)=>sum+number(s.final_price),0);
 return {count:sales.length,total,average:sales.length ? total/sales.length : 0,units:sales.length,clients:clients.length,repeatClients:clients.filter(c=>c.purchases>1).length,products:Array.from(products.values()).sort((a,b)=>b.units-a.units || b.amount-a.amount || a.name.localeCompare(b.name)),topClients:clients};
}
