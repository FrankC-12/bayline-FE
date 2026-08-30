"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useInspections } from "@/hooks/useInspections";
import { useVehicleLookup } from "@/hooks/useVehicleLookUp";
import { useUsers } from "@/hooks/useUser";
import CreateInspectionPanel from "./CreateInspectionPanel";

const STATUS_LABELS: Record<string, string> = { en_proceso: "En proceso", completada: "Completada" };
const STATUS_STYLES: Record<string, string> = {
  en_proceso: "bg-blue-light text-blue",
  completada: "bg-emerald-100 text-emerald-700",
};

function isToday(iso: string) {
  return new Date(iso).toDateString() === new Date().toDateString();
}

export default function InspectionsView() {
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;

  const { inspections, loading, addInspection, removeInspection } = useInspections(filialId);
  const { vehicleMap } = useVehicleLookup(filialId);
  const { users } = useUsers({ filialId });

  const [onlyToday, setOnlyToday] = useState(true);
  const [search, setSearch] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);

  const inspectorName = (id: string) => users.find((u) => u.id === id)?.full_name ?? "—";

  const filtered = useMemo(() => {
    return inspections.filter((i) => {
      if (onlyToday && !isToday(i.created_at)) return false;
      if (search) {
        const term = search.toLowerCase();
        const info = vehicleMap.get(i.vehicle_id);
        const haystack = [info?.vehicle.plate, info?.client.full_name].join(" ").toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [inspections, onlyToday, search, vehicleMap]);

  if (!filialId) return null;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-navy">Inspecciones Preliminares</h1>
          <p className="mt-1 text-sm text-steel">Primer paso del flujo · la vista se reinicia diariamente</p>
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
          onClick={() => setOnlyToday((v) => !v)}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
            onlyToday ? "border-blue bg-blue-light text-blue" : "border-navy/15 text-steel hover:text-navy"
          }`}
        >
          Hoy ·{" "}
          {new Date().toLocaleDateString("es-VE", { weekday: "long", day: "numeric", month: "long" })}
        </button>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por placa o cliente..."
          className="flex-1 rounded-full border border-navy/15 bg-white px-4 py-2 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
        {loading ? (
          <div className="p-12 text-center text-sm text-steel">Cargando inspecciones...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-steel">No hay inspecciones que coincidan.</div>
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
    </div>
  );
}