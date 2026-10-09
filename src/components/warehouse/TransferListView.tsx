"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, X, ArrowRight } from "lucide-react";
import { useWarehouseScope } from "@/contexts/WarehouseContext";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import { useTransfers } from "@/hooks/useTransfers";
import { useServiceOrderPartRequests } from "@/hooks/useServiceOrderPartRequests";
import { usePartSaleRequests } from "@/hooks/usePartSaleRequests";
import { setWorkshopWarehouse } from "@/lib/api/warehouse";
import { formatElapsed } from "@/lib/time";
import type { ServiceOrderPartRequest } from "@/types/warehouse";
import CreateTransferModal from "./CreateTransferModal";
import ErrorState from "@/components/common/ErrorState";

const STAGES = ["pendiente", "en_progreso", "por_retirar", "completado"] as const;
type Stage = typeof STAGES[number];
const LABELS: Record<Stage, string> = { pendiente: "Pendientes", en_progreso: "En progreso", por_retirar: "Por retirar", completado: "Completados" };
const BADGES: Record<Stage, string> = { pendiente: "bg-ash text-steel", en_progreso: "bg-blue-light text-blue", por_retirar: "bg-amber-100 text-amber-800", completado: "bg-emerald-100 text-emerald-700" };
const hours = (start: string | null | undefined, end: number) => start ? Math.max(0, end-new Date(start).getTime())/3600000 : 0;
const duration = (value: number) => `${Math.floor(value)}h ${Math.round((value%1)*60)}m`;
function clock(request: ServiceOrderPartRequest) {
  if (request.stage === "por_retirar") return { label: "POR RETIRAR", start: request.completed_at, end: request.picked_up_at };
  if (request.stage === "en_progreso") return { label: "PREPARANDO", start: request.preparation_started_at, end: request.completed_at };
  return { label: request.stage === "completado" ? "ALMACÉN" : "ESPERANDO", start: request.fulfilled_at, end: request.completed_at };
}

export default function TransfersListView() {
  const { filialId, warehouses, activeWarehouse, activeWarehouseId, createWarehouse, refreshWarehouses } = useWarehouseScope();
  const { transfers, loading: transfersLoading, error: transfersError, addTransfer, setStatus, refresh: refreshTransfers } = useTransfers(filialId);
  const { requests, loading, error, actionError, pendingId, start, complete, acknowledge, refresh } = useServiceOrderPartRequests(filialId);
  const { requests: sales, loading: salesLoading, error: salesError, refresh: refreshSales } = usePartSaleRequests(filialId);
  const { canEdit } = useModuleAccess("almacen");
  const [tab, setTab] = useState<"despachos" | "transferencias" | "mostrador">("despachos");
  const [stage, setStage] = useState<Stage>("pendiente");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [configuring, setConfiguring] = useState(false);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const timer=setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(timer); }, []);
  const scoped = useMemo(() => requests.filter((request) => !activeWarehouseId || request.warehouse_id === activeWarehouseId || (!request.warehouse_id && request.lines.some((line) => line.warehouses.some((item) => item.warehouse_id === activeWarehouseId)))), [requests, activeWarehouseId]);
  const selected = scoped.find((request) => request.id === selectedId);
  const counts = Object.fromEntries(STAGES.map((value) => [value, scoped.filter((request) => request.stage === value).length])) as Record<Stage, number>;
  const finished = scoped.filter((request) => request.completed_at && request.fulfilled_at);
  const avg = finished.length ? finished.reduce((sum, request) => sum+hours(request.fulfilled_at, new Date(request.completed_at!).getTime()), 0)/finished.length : null;
  const waitingAvg = finished.length ? finished.reduce((sum, request) => sum+hours(request.fulfilled_at, new Date(request.preparation_started_at ?? request.completed_at!).getTime()), 0)/finished.length : 0;
  const preparationAvg = finished.length ? finished.reduce((sum, request) => sum+(request.preparation_started_at ? hours(request.preparation_started_at, new Date(request.completed_at!).getTime()) : 0), 0)/finished.length : 0;
  const overdue = scoped.filter((request) => request.stage === "pendiente" && hours(request.fulfilled_at, now)>24).length;
  const term=search.trim().toLowerCase();
  const visible = scoped.filter((request) => request.stage === stage && `${request.code} ${request.service_order_code} ${request.vehicle_label} ${request.advisor_name ?? ""} ${request.lines.map((line) => `${line.part_code} ${line.part_name}`).join(" ")}`.toLowerCase().includes(term));
  const scopedTransfers = transfers.filter((transfer) => (!activeWarehouseId || transfer.origin_warehouse_id === activeWarehouseId || transfer.destination_warehouse_id === activeWarehouseId) && `${transfer.code} ${transfer.note ?? ""}`.toLowerCase().includes(term));
  const salesHere = sales.filter((sale) => !activeWarehouseId || sale.lines.some((line) => line.warehouse_id === activeWarehouseId));
  const warehouseName = (id: string) => warehouses.find((warehouse) => warehouse.id === id)?.name ?? "—";
  async function changeTransfer(id: string, status: string) { setLocalError(null); try { await setStatus(id, status); await refresh(); } catch (err) { setLocalError(err instanceof Error ? err.message : "No se pudo actualizar el traslado."); } }
  async function configure() {
    if (!activeWarehouseId) return;
    setConfiguring(true); setLocalError(null);
    try { await setWorkshopWarehouse(activeWarehouseId); await refreshWarehouses(); }
    catch (err) { setLocalError(err instanceof Error ? err.message : "No se pudo asignar el almacén del taller."); }
    finally { setConfiguring(false); }
  }
  return <div>
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div><h1 className="font-display text-3xl font-bold text-navy">Despachos — {activeWarehouse?.name ?? "Almacén"}</h1><p className="mt-2 text-sm text-steel">Solicitudes del taller (ODS) y traslados con origen o destino en este almacén</p>
        {activeWarehouse?.is_workshop_default ? <p className="mt-2 text-xs font-semibold text-blue">Atiende: Taller (ODS)</p> : canEdit && activeWarehouse && <button type="button" disabled={configuring} onClick={() => void configure()} className="mt-2 text-xs font-semibold text-blue underline">{configuring ? "Asignando…" : "Usar este almacén para solicitudes del taller"}</button>}
      </div>
      {canEdit && <button onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-2 rounded-full bg-blue px-5 py-3 text-sm font-semibold text-white"><Plus className="h-4 w-4" />Nueva transferencia</button>}
    </header>
    <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[{ label:"Pendientes", value:counts.pendiente, note:"Sin iniciar", color:"text-navy" },{ label:"En progreso", value:counts.en_progreso, note:"Preparándose ahora", color:"text-blue" },{ label:"Vencidas (> 24 h)", value:overdue, note:"Pendientes sin iniciar", color:"text-red-700" },{ label:"Tiempo del almacén (prom.)", value:avg === null ? "—" : duration(avg), note:avg === null ? "Sin despachos completados" : `Solicitud → despacho · Espera ${duration(waitingAvg)} / Prep. ${duration(preparationAvg)}`, color:"text-navy" }].map((card) => <div key={card.label} className="rounded-2xl border border-navy/10 bg-white p-5"><p className="text-xs text-steel">{card.label}</p><p className={`my-2 font-mono text-2xl font-bold ${card.color}`}>{card.value}</p><p className="text-xs text-steel">{card.note}</p></div>)}
    </div>
    {localError && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{localError}</p>}
    {actionError && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{actionError.message}</p>}
    <section className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-navy/10 p-4">
        <div className="flex gap-1">{([['despachos','Despachos',scoped.filter((request) => request.stage !== 'completado').length],['transferencias','Transferencias',scopedTransfers.length],['mostrador','Mostrador',salesHere.length]] as const).map(([value,label,count]) => <button key={value} type="button" onClick={() => setTab(value)} className={`rounded-xl px-3 py-3 text-sm font-semibold ${tab===value ? 'bg-blue-light text-blue' : 'text-steel'}`}>{label} <span className="ml-1 rounded-full bg-navy/10 px-2 py-0.5 text-xs">{count}</span></button>)}</div>
        {tab === 'despachos' && <div className="flex flex-wrap rounded-full bg-ash p-1">{STAGES.map((value) => <button key={value} type="button" onClick={() => setStage(value)} className={`rounded-full px-3 py-2 text-xs font-semibold ${stage===value ? 'bg-white text-navy shadow-sm' : 'text-steel'}`}>{LABELS[value]} · {counts[value]}</button>)}</div>}
        <label className="flex items-center gap-2 rounded-full border border-navy/15 px-3 py-2"><Search className="h-4 w-4 text-steel" /><input aria-label="Buscar solicitudes o transferencias" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ODS, placa o repuesto" className="w-44 bg-transparent text-sm outline-none" /></label>
      </div>
      {tab === 'despachos' && <>
        {error && <ErrorState error={error} onRetry={refresh} />}
        {loading && scoped.length===0 && <p className="p-8 text-center text-sm text-steel">Cargando despachos…</p>}
        {!loading && !error && visible.length===0 && <p className="p-10 text-center text-sm text-steel">No hay despachos {LABELS[stage].toLowerCase()} en este almacén. Las solicitudes aparecen al enviarlas desde una ODS.</p>}
        {visible.length>0 && <div className="overflow-x-auto"><table className="w-full min-w-[880px] text-left text-sm"><thead className="bg-ash/50 font-mono text-[10px] uppercase tracking-widest text-steel"><tr>{['Cronómetro','Documento','Vehículo · Asesor','Ítems','Estado','Acción'].map((title) => <th key={title} className="px-5 py-3">{title}</th>)}</tr></thead><tbody>{visible.map((request) => {
          const timer=clock(request); const age=hours(timer.start, now); const pending=request.stage==='pendiente'; const missing=request.lines.filter((line) => line.shortfall_quantity>0 || line.transfer_quantity>0);
          return <tr key={request.id} className="border-t border-navy/10 hover:bg-ash/30"><td className="px-5 py-5"><p className="font-mono text-[10px] tracking-widest text-steel">{timer.label}</p><p className={`mt-1 whitespace-nowrap font-mono font-bold ${pending && age>24 ? 'text-red-700' : pending && age>4 ? 'text-amber-700' : 'text-emerald-700'}`}>{timer.start ? formatElapsed(timer.start,timer.end) : '—'}</p></td><td className="px-5 py-5"><button type="button" onClick={() => { setSelectedId(request.id); void acknowledge(request.id); }} className="text-left"><p className="font-mono font-bold text-navy">{request.service_order_code}</p><p className="mt-1 text-xs text-steel">{request.code}</p></button></td><td className="px-5 py-5"><p className="font-semibold text-navy">{request.vehicle_label.split(' · ')[0]}</p><p className="mt-1 text-xs text-steel">{request.vehicle_label.split(' · ').slice(1).join(' · ')} · {request.advisor_name ?? 'Sin asesor'}</p></td><td className="max-w-[260px] px-5 py-5"><p className="truncate">{request.lines.length} ítems · {request.lines.reduce((sum,line) => sum+line.quantity,0)} uds · {request.lines.map((line) => line.part_name).join(', ')}</p>{missing.map((line) => <p key={line.id} className="mt-1 text-xs font-semibold text-violet-800">{line.transfer_quantity>0 ? `Espera traslado: ${line.transfer_quantity}x ${line.part_name}` : `Reposición pendiente: ${line.shortfall_quantity}x ${line.part_name}`}</p>)}</td><td className="px-5 py-5"><span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${BADGES[request.stage]}`}>{LABELS[request.stage]}</span></td><td className="px-5 py-5">{canEdit && request.stage==='pendiente' ? <button type="button" disabled={!!pendingId} onClick={() => void start(request.id)} className="whitespace-nowrap rounded-full bg-blue px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">Iniciar preparación</button> : canEdit && request.stage==='en_progreso' ? <button type="button" disabled={!!pendingId} onClick={() => setSelectedId(request.id)} className="whitespace-nowrap rounded-full bg-blue px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">Completar despacho</button> : <button type="button" onClick={() => setSelectedId(request.id)} className="whitespace-nowrap rounded-full border border-navy/15 px-4 py-2 text-xs font-semibold">Ver detalle</button>}</td></tr>;
        })}</tbody></table></div>}
      </>}
      {tab==='transferencias' && <>
        {transfersError && <ErrorState error={transfersError} onRetry={refreshTransfers} />}
        {transfersLoading && <p className="p-8 text-sm text-steel">Cargando transferencias…</p>}
        {!transfersLoading && !transfersError && !scopedTransfers.length && <p className="p-10 text-center text-sm text-steel">No hay transferencias con origen o destino en este almacén.</p>}
        {scopedTransfers.map((transfer) => <div key={transfer.id} className="flex flex-wrap items-center justify-between gap-4 border-t border-navy/10 p-5"><div><p className="font-mono font-bold text-navy">{transfer.code}</p><p className="mt-1 flex items-center gap-2 text-sm text-steel">{warehouseName(transfer.origin_warehouse_id)} <ArrowRight className="h-4 w-4" />{warehouseName(transfer.destination_warehouse_id)}</p>{transfer.note && <p className="mt-1 text-xs text-violet-800">{transfer.note}</p>}<p className="mt-1 text-xs text-steel">{transfer.lines.reduce((sum,line) => sum+line.quantity,0)} unidades · {transfer.status.replaceAll('_',' ')}</p></div><div className="flex gap-2">{canEdit && transfer.status==='pedido' && <button onClick={() => void changeTransfer(transfer.id,'en_proceso')} className="rounded-full bg-blue px-4 py-2 text-xs font-semibold text-white">Iniciar traslado</button>}{canEdit && transfer.status==='en_proceso' && <button onClick={() => void changeTransfer(transfer.id,'completada')} className="rounded-full bg-blue px-4 py-2 text-xs font-semibold text-white">Confirmar recepción</button>}{canEdit && ['pedido','en_proceso'].includes(transfer.status) && !transfer.note?.startsWith('Traslado automático') && <button onClick={() => void changeTransfer(transfer.id,'cancelada')} className="rounded-full border border-red-200 px-4 py-2 text-xs text-red-700">Cancelar</button>}</div></div>)}
      </>}
      {tab==='mostrador' && <>{salesError && <ErrorState error={salesError} onRetry={refreshSales} />}{salesLoading && <p className="p-8 text-sm text-steel">Cargando solicitudes…</p>}{!salesLoading && !salesError && !salesHere.length && <p className="p-10 text-center text-sm text-steel">No hay solicitudes de mostrador.</p>}{salesHere.filter((sale) => `${sale.code} ${sale.client_name}`.toLowerCase().includes(term)).map((sale) => <Link key={sale.id} href={`/dashboard/repuestos/ventas/${sale.id}`} className="flex items-center justify-between border-t border-navy/10 p-5 text-sm"><div><p className="font-mono font-bold">{sale.code}</p><p className="mt-1 text-steel">{sale.client_name} · {sale.lines.map((line) => `${line.quantity}x ${line.part_name}`).join(', ')}</p></div><span>{sale.status.replaceAll('_',' ')}</span></Link>)}</>}
    </section>
    <p className="mt-5 text-xs leading-relaxed text-steel">El cronómetro mide cada etapa: <strong>Pendiente</strong> hasta que el almacenista inicia, <strong>En progreso</strong> hasta completar el despacho y <strong>Por retirar</strong> hasta que se confirma el retiro con foto desde la ODS. El retiro se mide aparte y no cuenta para el tiempo del almacén. Espera en rojo &gt; 24 h, ámbar &gt; 4 h.</p>
    {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/30 p-4" onClick={() => setSelectedId(null)}><section role="dialog" aria-modal="true" aria-labelledby="dispatch-detail-title" onClick={(event) => event.stopPropagation()} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"><div className="flex items-start justify-between gap-3"><div><h2 id="dispatch-detail-title" className="font-display text-xl font-bold">{selected.code} · {selected.service_order_code}</h2><p className="mt-1 text-sm text-steel">{selected.vehicle_label}</p><p className="mt-2 text-xs font-semibold text-blue">{selected.warehouse_name} · {LABELS[selected.stage]}</p></div><button type="button" aria-label="Cerrar detalle" onClick={() => setSelectedId(null)} className="rounded-full p-2 hover:bg-ash"><X className="h-5 w-5" /></button></div><div className="my-5 divide-y divide-navy/10">{selected.lines.map((line) => <div key={line.id} className="py-3"><p className="text-sm font-semibold">{line.quantity}x {line.part_name}</p><p className="mt-1 text-xs text-steel">{line.part_code} · {line.warehouses.map((warehouse) => `${warehouse.warehouse_name}: ${warehouse.quantity}`).join(', ')}</p>{line.shortfall_quantity>0 && <p className="mt-1 text-xs text-red-700">Faltan {line.shortfall_quantity}; pendiente de Compras.</p>}{line.transfer_quantity>0 && <p className="mt-1 text-xs text-violet-800">Espera {line.transfer_quantity} unidades por traslado.</p>}</div>)}</div>{selected.pickup_photo_url && <a href={selected.pickup_photo_url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-blue underline">Ver foto del retiro</a>}{actionError && <p role="alert" className="mt-3 text-sm text-red-700">{actionError.message}</p>}<div className="mt-4 flex justify-end gap-2">{canEdit && selected.stage==='pendiente' && <button disabled={!!pendingId} onClick={() => void start(selected.id)} className="rounded-full bg-blue px-5 py-3 text-sm font-semibold text-white">Iniciar preparación</button>}{canEdit && selected.stage==='en_progreso' && <button disabled={!!pendingId || selected.lines.some((line) => line.transfer_quantity>0)} onClick={() => void complete(selected.id)} className="rounded-full bg-blue px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{pendingId ? 'Despachando…' : 'Completar y descontar stock'}</button>}</div></section></div>}
    <CreateTransferModal open={createOpen} onClose={() => setCreateOpen(false)} filialId={filialId ?? ''} warehouses={warehouses} initialOriginId={activeWarehouseId ?? undefined} onSubmit={(origin,destination,lines) => addTransfer(origin,destination,lines).then(() => undefined)} onCreateWarehouse={createWarehouse} />
  </div>;
}
