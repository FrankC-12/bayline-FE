"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, ClipboardList, UserRound, Clock, CircleCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useServiceOrders } from "@/hooks/useServiceOrders";
import { useVehicleLookup } from "@/hooks/useVehicleLookUp";
import { useUserDirectory } from "@/hooks/useUserDirectory";
import ErrorState from "@/components/common/ErrorState";
import type { ServiceOrder, ServiceOrderStatus } from "@/types/serviceOrder";
import OrderCard from "./OrderCard";
import CreateOrderPanel, { type CreateOrderExtra } from "./CreateOrderPanel";

const COLUMNS: { status: ServiceOrderStatus; label: string; dot: string }[] = [
  { status: "pendiente", label: "Pendiente", dot: "bg-amber-500" },
  { status: "en_progreso", label: "En progreso", dot: "bg-blue" },
  { status: "completado", label: "Completado", dot: "bg-emerald-500" },
];

export default function OrdersBoard() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;

  const { orders, loading, error, addOrder, refresh } = useServiceOrders(filialId, "active");
  const { vehicleMap } = useVehicleLookup(filialId);
  const { users } = useUserDirectory({ filialId });
  const [presetVehicleId,setPresetVehicleId]=useState<string | null>(null);
  useEffect(()=> {const query=new URLSearchParams(window.location.search);if(query.get("create")==="1") {setPresetVehicleId(query.get("vehicle_id"));setPanelOpen(true);}},[]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [technician, setTechnician] = useState("");
  const [attentionOnly, setAttentionOnly] = useState(false);
  const needsAttention = (order: ServiceOrder) => !order.technician_user_id;
  const filteredOrders = orders.filter(order => {
    const info = vehicleMap.get(order.vehicle_id);
    const haystack = [order.code, info?.vehicle.plate, info?.vehicle.brand, info?.vehicle.model, info?.client.full_name].join(" ").toLocaleLowerCase("es");
    return haystack.includes(search.trim().toLocaleLowerCase("es")) &&
      (!technician || order.technician_user_id === technician) && (!attentionOnly || needsAttention(order));
  });


  const technicianName = (id: string | null) => users.find((u) => u.id === id)?.full_name ?? "";

  const byStatus = (() => {
    const grouped: Record<string, ServiceOrder[]> = { pendiente: [], en_progreso: [], completado: [] };
    for (const o of filteredOrders) {
      grouped[o.status]?.push(o);
    }
    return grouped;
  })();

  async function handleCreate(
    vehicleId: string,
    orderTypeId: string,
    extra: CreateOrderExtra,
    inspectionId: string
  ) {
    if (!filialId) return;
    const created = await addOrder({
      filial_id: filialId,
      vehicle_id: vehicleId,
      order_type_id: orderTypeId,
      inspection_id: inspectionId,
      ...extra,
    });
    router.push(`/dashboard/servicios/${created.id}`);
  }

  if (!filialId) return null;

  return (
    <div className="min-w-0">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-blue">Gestión del taller</p>
          <h1 className="font-display text-3xl font-bold text-navy">Órdenes de Servicio</h1>
          <p className="mt-1 text-sm text-steel">Organiza el trabajo del taller y consulta el siguiente paso de cada orden.</p>
        </div>
        <button
          onClick={() => setPanelOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue px-5 py-3 shadow-sm text-sm font-semibold text-white transition hover:bg-navy"
        >
          <Plus className="h-4 w-4" />
          Crear ODS
        </button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[{label:"Órdenes activas",value:orders.length,icon:ClipboardList,tone:"bg-blue-light text-blue"},{label:"Sin técnico",value:orders.filter(o=>!o.technician_user_id).length,icon:UserRound,tone:"bg-amber-50 text-amber-700"},{label:"Trabajo en progreso",value:orders.filter(o=>o.status==="en_progreso").length,icon:Clock,tone:"bg-blue-light text-blue"},{label:"Trabajo completado",value:orders.filter(o=>o.status==="completado").length,icon:CircleCheck,tone:"bg-emerald-50 text-emerald-700"}].map(item=><div key={item.label} className="rounded-2xl border border-navy/10 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-2"><p className="text-xs leading-relaxed text-steel">{item.label}</p><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${item.tone}`}><item.icon aria-hidden="true" className="h-4 w-4" /></span></div><p className="mt-2 font-display text-2xl font-bold text-navy">{loading ? "—" : item.value}</p></div>)}
      </div>
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-navy/10 bg-white p-4">
        <label className="flex min-w-[180px] flex-1 items-center gap-2 rounded-xl border border-navy/10 bg-slate-50 px-3 py-2.5 focus-within:border-blue focus-within:ring-2 focus-within:ring-blue/10"><Search aria-hidden="true" className="h-4 w-4 shrink-0 text-steel"/><input aria-label="Buscar órdenes" value={search} onChange={e=>setSearch(e.target.value)} placeholder="ODS, placa, vehículo o cliente" className="min-w-0 w-full bg-transparent text-sm outline-none"/></label>
        <select aria-label="Filtrar por técnico" value={technician} onChange={e=>setTechnician(e.target.value)} className="max-w-full rounded-xl border border-navy/15 px-3 py-2 text-sm"><option value="">Todos los técnicos</option>{users.filter(user=>orders.some(order=>order.technician_user_id===user.id)).map(user=><option key={user.id} value={user.id}>{user.full_name}</option>)}</select>
        <button type="button" aria-pressed={attentionOnly} onClick={()=>setAttentionOnly(!attentionOnly)} className={`rounded-full border px-4 py-2 text-sm font-semibold ${attentionOnly ? "border-amber-300 bg-amber-50 text-amber-800" : "border-navy/15 text-steel"}`}>Necesitan atención</button>
        {(search || technician || attentionOnly) && <button type="button" onClick={()=>{setSearch("");setTechnician("");setAttentionOnly(false);}} className="text-sm font-semibold text-blue">Limpiar filtros</button>}
        <p role="status" className="w-full text-xs text-steel">{filteredOrders.length} de {orders.length} órdenes · Los indicadores resumen todas las órdenes activas.</p>
      </div>
      {loading ? (
        <div className="rounded-2xl border border-navy/10 bg-white p-12 text-center text-sm text-steel">
          Cargando órdenes...
        </div>
      ) : error ? (
        <ErrorState error={error} onRetry={refresh} />
      ) : (
        <div className="grid min-w-0 items-start gap-4 lg:grid-cols-3">
          {COLUMNS.map((col) => (
            <section key={col.status} aria-label={col.label} className="min-w-0 rounded-2xl border border-navy/5 bg-slate-100/70 p-3">
              <div className="mb-4 flex items-center gap-2 px-1 pt-1">
                <span className={`h-2.5 w-2.5 rounded-full ${col.dot}`} />
                <span className="font-mono text-xs font-bold uppercase tracking-widest text-navy">
                  {col.label}
                </span>
                <span className="ml-auto rounded-lg bg-white px-2 py-0.5 text-xs font-bold text-navy">
                  {byStatus[col.status]?.length ?? 0}
                </span>
              </div>
              <p className="mb-4 px-1 text-xs text-steel">{col.status === "pendiente" ? "Por iniciar en el taller" : col.status === "en_progreso" ? "Trabajo en curso" : "Revisar factura, cobro y cierre"}</p>
              <div className="space-y-3">
                {byStatus[col.status]?.map((o) => (
                  <Link key={o.id} href={`/dashboard/servicios/${o.id}`} className="block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue">
                    <OrderCard
                      order={o}
                      info={vehicleMap.get(o.vehicle_id)}
                      technicianName={technicianName(o.technician_user_id)}
                    />
                  </Link>
                ))}
                {byStatus[col.status]?.length === 0 && (
                  <p className="rounded-xl border border-dashed border-navy/15 p-4 text-center text-xs text-steel">
                    Sin órdenes en esta etapa con los filtros actuales
                  </p>
                )}
              </div>
            </section>
          ))}
        </div>
      )}

      <CreateOrderPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        filialId={filialId}
        presetVehicleId={presetVehicleId}
        onSubmit={handleCreate}
      />
    </div>
  );
}