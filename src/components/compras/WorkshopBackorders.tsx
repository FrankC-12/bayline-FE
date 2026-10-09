"use client";

import { listWorkshopBackorders, type WorkshopBackorder } from "@/lib/api/warehouse";
import { useListLoader } from "@/hooks/useListLoader";
import ErrorState from "@/components/common/ErrorState";

export default function WorkshopBackorders({ filialId }: { filialId: string }) {
  const { data, error, refresh } = useListLoader<WorkshopBackorder>(() => listWorkshopBackorders(filialId), [filialId], 30000);
  if (error) return <ErrorState error={error} onRetry={refresh} compact />;
  if (!data.length) return null;
  return <section className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5"><h2 className="font-display text-lg font-bold text-navy">Repuestos pendientes del taller</h2><p className="mt-1 text-sm text-steel">Estas solicitudes se enviaron sin existencia suficiente y requieren reposición.</p><div className="mt-3 divide-y divide-amber-200">{data.map((item) => <div key={`${item.request_id}-${item.part_id}`} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"><div><p className="font-semibold">{item.quantity}x {item.part_name} · {item.part_code}</p><p className="mt-1 text-xs text-steel">{item.order_code} · {item.request_code} · {item.warehouse_name ?? "Taller"}</p></div><span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-800">Pendiente de reposición</span></div>)}</div></section>;
}
