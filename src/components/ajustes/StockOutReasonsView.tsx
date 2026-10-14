"use client";
import { useAuth } from "@/contexts/AuthContext";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import { useListLoader } from "@/hooks/useListLoader";
import { apiFetch } from "@/lib/api/client";
import type { StockInReason } from "@/types/warehouse";
import SimpleCatalogView from "./SimpleCatalogView";
export default function StockOutReasonsView() {
 const { currentUser }=useAuth();const filialId=currentUser?.filialId;
 const { canEdit }=useModuleAccess("ajustes");
 const { data,loading,error,refresh }=useListLoader<StockInReason>(()=>filialId ? apiFetch(`/stock-out-reasons?filial_id=${filialId}&include_inactive=true`) : Promise.resolve([]),[filialId]);
 async function mutate(id: string | null,body: object) { await apiFetch(`/stock-out-reasons${id ? `/${id}` : ""}?filial_id=${filialId}`,{ method:id ? "PATCH" : "POST",body:JSON.stringify(body) });await refresh(); }
 return <SimpleCatalogView description="Motivos para una salida manual en Almacén. Las ventas y los consumos de ODS descuentan stock automáticamente." items={data} loading={loading} fetchError={error} onRetry={refresh} canEdit={canEdit} addPlaceholder="Nombre del motivo de salida" addButtonLabel="Agregar motivo" emptyTitle="No hay motivos de salida." onAdd={name=>mutate(null,{name})} onRename={(id,name)=>mutate(id,{name})} onToggleActive={(id,is_active)=>mutate(id,{is_active})} />;
}
