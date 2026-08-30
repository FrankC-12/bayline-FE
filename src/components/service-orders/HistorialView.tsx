"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useServiceOrders } from "@/hooks/useServiceOrders";
import { useVehicleLookup } from "@/hooks/useVehicleLookUp";
import { useUsers } from "@/hooks/useUser";

const STATUS_LABELS: Record<string, string> = {
  orden_cerrada: "Orden Cerrada",
  cancelado: "Cancelado",
};

const STATUS_STYLES: Record<string, string> = {
  orden_cerrada: "bg-slate-100 text-slate-600",
  cancelado: "bg-red-100 text-red-700",
};

type FilterTab = "todos" | "orden_cerrada" | "cancelado";

export default function HistorialView() {
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;

  const { orders, loading } = useServiceOrders(filialId, "history");
  const { vehicleMap } = useVehicleLookup(filialId);
  const { users } = useUsers({ filialId });

  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<FilterTab>("todos");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const technicianName = (id: string | null) => users.find((u) => u.id === id)?.full_name ?? "—";

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (tab !== "todos" && o.status !== tab) return false;

      const created = new Date(o.created_at);
      if (from && created < new Date(from)) return false;
      if (to && created > new Date(`${to}T23:59:59`)) return false;

      if (search) {
        const term = search.toLowerCase();
        const info = vehicleMap.get(o.vehicle_id);
        const haystack = [o.code, info?.vehicle.plate, info?.client.full_name, technicianName(o.technician_user_id)]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }

      return true;
    });
  }, [orders, tab, from, to, search, vehicleMap, users]);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-navy">Historial de Órdenes de Servicio</h1>
      <p className="mt-1 text-sm text-steel">Órdenes cerradas o canceladas</p>

      <div className="relative mt-6">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por número de ODS, cliente, vehículo o técnico..."
          className="w-full rounded-full border border-navy/15 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="flex rounded-full border border-navy/15 bg-white p-1">
          {(["todos", "orden_cerrada", "cancelado"] as FilterTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                tab === t ? "bg-navy text-white" : "text-steel hover:text-navy"
              }`}
            >
              {t === "todos" ? "Todos" : t === "orden_cerrada" ? "Orden Cerrada" : "Cancelado"}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-steel">
          Desde
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border border-navy/15 px-3 py-1.5 text-sm outline-none focus:border-blue"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-steel">
          Hasta
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border border-navy/15 px-3 py-1.5 text-sm outline-none focus:border-blue"
          />
        </label>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-navy/10 bg-white">
        {loading ? (
          <div className="p-12 text-center text-sm text-steel">Cargando historial...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-steel">No hay órdenes que coincidan.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-navy/10 bg-ash">
              <tr>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">
                  ODS
                </th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">
                  Fecha
                </th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">
                  Vehículo
                </th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">
                  Cliente
                </th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">
                  Técnico
                </th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {filtered.map((o) => {
                const info = vehicleMap.get(o.vehicle_id);
                return (
                  <tr key={o.id} className="transition hover:bg-ash/60">
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/servicios/${o.id}`}
                        className="font-mono font-semibold text-blue hover:text-navy"
                      >
                        {o.code}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-steel">
                      {new Date(o.created_at).toLocaleDateString("es-VE")}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-navy">
                        {info ? `${info.vehicle.brand} ${info.vehicle.model}` : "—"}
                      </p>
                      <p className="font-mono text-xs text-steel">{info?.vehicle.plate}</p>
                    </td>
                    <td className="px-6 py-4 text-steel">{info?.client.full_name ?? "—"}</td>
                    <td className="px-6 py-4 text-steel">{technicianName(o.technician_user_id)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest ${STATUS_STYLES[o.status]}`}
                      >
                        {STATUS_LABELS[o.status] ?? o.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}