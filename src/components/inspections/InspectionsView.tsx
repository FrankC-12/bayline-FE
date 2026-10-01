"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Wrench, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useInspections } from "@/hooks/useInspections";
import { useVehicleLookup } from "@/hooks/useVehicleLookUp";
import { useUserDirectory } from "@/hooks/useUserDirectory";
import { createServiceOrder } from "@/lib/api/serviceOrders";
import type { Inspection } from "@/types/inspection";
import type { ServiceOrderType } from "@/types/serviceOrder";
import CreateInspectionPanel from "./CreateInspectionPanel";
import CreateOrderPanel, { type CreateOrderExtra } from "@/components/service-orders/CreateOrderPanel";
import VehicleDamageMap from "./VehicleDamageMap";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";

const STATUS_LABELS: Record<string, string> = { en_proceso: "En proceso", completada: "Completada" };
const STATUS_STYLES: Record<string, string> = {
  en_proceso: "bg-blue-light text-blue",
  completada: "bg-emerald-100 text-emerald-700",
};

function isToday(iso: string) {
  return new Date(iso).toDateString() === new Date().toDateString();
}

export default function InspectionsView() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;

  const { inspections, loading, error, addInspection, removeInspection, refresh } = useInspections(filialId);
  const { vehicleMap } = useVehicleLookup(filialId);
  const { users } = useUserDirectory({ filialId });

  const [onlyToday, setOnlyToday] = useState(true);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [orderInspection, setOrderInspection] = useState<Inspection | null>(null);
  const [damageView, setDamageView] = useState<Inspection | null>(null);

  const hasCustomFilter = !!search || !!dateFrom || !!dateTo;

  function resetToToday() {
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setOnlyToday(true);
  }

  async function handleCreateOrder(
    vehicleId: string,
    orderType: ServiceOrderType,
    extra: CreateOrderExtra,
    inspectionId: string
  ) {
    if (!filialId) return;
    const created = await createServiceOrder({
      filial_id: filialId,
      vehicle_id: vehicleId,
      order_type: orderType,
      inspection_id: inspectionId,
      ...extra,
    });
    router.push(`/dashboard/servicios/${created.id}`);
  }

  const inspectorName = (id: string) => users.find((u) => u.id === id)?.full_name ?? "—";

  const filtered = useMemo(() => {
    // Searching or picking a date range escapes the "Hoy" shortcut
    // automatically — finding a 2-week-old inspection by plate shouldn't
    // require first remembering to turn today's filter off.
    const effectiveOnlyToday = onlyToday && !hasCustomFilter;
    return inspections.filter((i) => {
      if (effectiveOnlyToday && !isToday(i.created_at)) return false;
      if (dateFrom && i.created_at.slice(0, 10) < dateFrom) return false;
      if (dateTo && i.created_at.slice(0, 10) > dateTo) return false;
      if (search) {
        const term = search.toLowerCase();
        const info = vehicleMap.get(i.vehicle_id);
        const haystack = [info?.vehicle.plate, info?.client.full_name].join(" ").toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [inspections, onlyToday, hasCustomFilter, search, dateFrom, dateTo, vehicleMap]);

  if (!filialId) return null;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-navy">Inspecciones Preliminares</h1>
          <p className="mt-1 text-sm text-steel">
            Primer paso del flujo · muestra el día de hoy por defecto — busca por placa, cliente o un rango de
            fechas para ver el historial completo
          </p>
        </div>
        <button
          onClick={() => setPanelOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy"
        >
          <Plus className="h-4 w-4" />
          Nueva Inspección
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button
          onClick={() => (onlyToday && !hasCustomFilter ? undefined : resetToToday())}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
            onlyToday && !hasCustomFilter ? "border-blue bg-blue-light text-blue" : "border-navy/15 text-steel hover:text-navy"
          }`}
        >
          Hoy ·{" "}
          {new Date().toLocaleDateString("es-VE", { weekday: "long", day: "numeric", month: "long" })}
        </button>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por placa o cliente..."
          className="min-w-[200px] flex-1 rounded-full border border-navy/15 bg-white px-4 py-2 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
        />
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            aria-label="Desde"
            className="rounded-full border border-navy/15 bg-white px-3 py-2 text-sm text-steel outline-none focus:border-blue"
          />
          <span className="text-xs text-steel">a</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            aria-label="Hasta"
            className="rounded-full border border-navy/15 bg-white px-3 py-2 text-sm text-steel outline-none focus:border-blue"
          />
        </div>
        {hasCustomFilter && (
          <button onClick={resetToToday} className="text-sm font-medium text-steel hover:text-navy">
            Limpiar filtros
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
        {loading ? (
          <div className="p-12 text-center text-sm text-steel">Cargando inspecciones...</div>
        ) : error ? (
          <ErrorState error={error} onRetry={refresh} compact />
        ) : filtered.length === 0 ? (
          <EmptyState
            compact
            title={
              search
                ? `Sin resultados para "${search}"`
                : dateFrom || dateTo
                  ? "No hay inspecciones en el rango de fechas elegido."
                  : onlyToday
                    ? "No hay inspecciones registradas hoy."
                    : "No hay inspecciones registradas."
            }
          />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-navy/10 bg-ash">
              <tr>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">
                  ODS
                </th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">
                  Fecha · Hora
                </th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">
                  Vehículo
                </th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">
                  Cliente
                </th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">
                  Inspector
                </th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">
                  Estado
                </th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {filtered.map((i) => {
                const info = vehicleMap.get(i.vehicle_id);
                return (
                  <tr key={i.id} className="transition hover:bg-ash/60">
                    <td className="px-6 py-4">
                      {i.service_order_id ? (
                        <Link
                          href={`/dashboard/servicios/${i.service_order_id}`}
                          className="font-mono font-semibold text-blue hover:text-navy"
                        >
                          Ver ODS
                        </Link>
                      ) : i.status === "completada" ? (
                        <button
                          onClick={() => setOrderInspection(i)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-blue/30 bg-blue-light px-3 py-1.5 text-xs font-semibold text-blue transition hover:border-blue hover:bg-blue hover:text-white"
                        >
                          <Wrench className="h-3.5 w-3.5" />
                          Crear ODS
                        </button>
                      ) : (
                        <span className="text-steel">Sin ODS</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-steel">
                      {new Date(i.created_at).toLocaleString("es-VE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-navy">
                        {info ? `${info.vehicle.brand} ${info.vehicle.model}` : "—"}
                      </p>
                      <p className="font-mono text-xs text-steel">
                        {info?.vehicle.plate}
                        {i.mileage ? ` · ${i.mileage.toLocaleString("es-VE")} km` : ""}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-steel">{info?.client.full_name ?? "—"}</td>
                    <td className="px-6 py-4 text-steel">{inspectorName(i.inspector_user_id)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest ${STATUS_STYLES[i.status]}`}
                      >
                        {STATUS_LABELS[i.status]}
                      </span>
                      {i.damages.length > 0 && (
                        <button
                          onClick={() => setDamageView(i)}
                          className="ml-2 inline-flex items-center rounded-full border border-navy/15 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-steel transition hover:border-blue hover:text-blue"
                        >
                          {i.damages.length} daño{i.damages.length === 1 ? "" : "s"}
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!i.service_order_id && (
                        <button
                          onClick={() => removeInspection(i.id)}
                          aria-label="Eliminar inspección"
                          className="rounded-lg p-2 text-red-500 transition hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <CreateInspectionPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        filialId={filialId}
        onSubmit={addInspection}
      />

      <CreateOrderPanel
        open={orderInspection !== null}
        onClose={() => setOrderInspection(null)}
        filialId={filialId}
        presetInspection={orderInspection}
        onSubmit={handleCreateOrder}
      />

      {damageView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setDamageView(null)}>
          <div onClick={(event) => event.stopPropagation()} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-display text-lg font-bold text-navy">Daños registrados</p>
              <button
                onClick={() => setDamageView(null)}
                aria-label="Cerrar"
                className="rounded-lg p-2 text-steel hover:bg-ash hover:text-navy"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <VehicleDamageMap damages={damageView.damages} editable={false} />
            {damageView.photo_urls.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-steel">Fotos generales</p>
                <div className="grid grid-cols-4 gap-2">
                  {damageView.photo_urls.map((url) => (
                    <a key={url} href={url} target="_blank" rel="noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="aspect-square w-full rounded-lg object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}