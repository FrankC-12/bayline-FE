"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePartSales } from "@/hooks/usePartSales";
import { useVehicleSales } from "@/hooks/useVehicleSales";
import { useParts } from "@/hooks/useParts";
import { useVehicles } from "@/hooks/useVehicles";
import { useUsers } from "@/hooks/useUser";

export default function VentasView() {
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;

  const [tab, setTab] = useState<"repuestos" | "vehiculos">("repuestos");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { sales: partSales, loading: loadingPartSales } = usePartSales(filialId);
  const { parts } = useParts(filialId);

  const { sales: vehicleSales, loading: loadingVehicleSales } = useVehicleSales(filialId);
  const { vehicles } = useVehicles(filialId);
  const { users } = useUsers({ filialId });

  const partName = (id: string) => parts.find((p) => p.id === id)?.name ?? "—";
  const vehicleLabel = (id: string) => {
    const v = vehicles.find((x) => x.id === id);
    return v ? `${v.brand} ${v.model} ${v.year}` : "—";
  };
  const advisorName = (id: string | null) => (id ? users.find((u) => u.id === id)?.full_name ?? "—" : "—");

  function inRange(isoDate: string) {
    const d = isoDate.slice(0, 10);
    if (dateFrom && d < dateFrom) return false;
    if (dateTo && d > dateTo) return false;
    return true;
  }

  const filteredPartSales = useMemo(() => {
    return partSales.filter((s) => {
      if (!inRange(s.created_at)) return false;
      if (search) {
        const term = search.toLowerCase();
        const repuestos = s.lines.map((l) => partName(l.part_id)).join(", ").toLowerCase();
        if (!s.client_name.toLowerCase().includes(term) && !repuestos.includes(term)) return false;
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partSales, search, dateFrom, dateTo, parts]);

  const filteredVehicleSales = useMemo(() => {
    return vehicleSales.filter((s) => {
      if (!inRange(s.created_at)) return false;
      if (search) {
        const term = search.toLowerCase();
        if (!s.client_name.toLowerCase().includes(term) && !vehicleLabel(s.vehicle_id).toLowerCase().includes(term)) {
          return false;
        }
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleSales, search, dateFrom, dateTo, vehicles]);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-navy">Ventas</h1>
      <p className="mt-1 text-sm text-steel">Reporte consolidado de todas las ventas del negocio</p>

      <div className="mt-6 mb-4 flex w-fit rounded-full border border-navy/15 p-1">
        <button
          onClick={() => setTab("repuestos")}
          className={`rounded-full px-5 py-2 text-sm font-medium transition ${tab === "repuestos" ? "bg-navy text-white" : "text-steel"}`}
        >
          Ventas de Repuestos
        </button>
        <button
          onClick={() => setTab("vehiculos")}
          className={`rounded-full px-5 py-2 text-sm font-medium transition ${tab === "vehiculos" ? "bg-navy text-white" : "text-steel"}`}
        >
          Ventas de Vehículos
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tab === "repuestos" ? "Buscar por repuesto o cliente..." : "Buscar por vehículo o cliente..."}
            className="w-full rounded-full border border-navy/15 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-navy">Desde</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none focus:border-blue"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-navy">Hasta</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none focus:border-blue"
          />
        </div>
      </div>

      {tab === "repuestos" ? (
        <div className="overflow-x-auto rounded-2xl border border-navy/10 bg-white">
          {loadingPartSales ? (
            <div className="p-12 text-center text-sm text-steel">Cargando ventas...</div>
          ) : filteredPartSales.length === 0 ? (
            <div className="p-12 text-center text-sm text-steel">No hay ventas que coincidan.</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-navy/10 bg-ash">
                <tr>
                  <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Fecha</th>
                  <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Cliente</th>
                  <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Repuesto(s)</th>
                  <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Monto</th>
                  <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Estado de pago</th>
                  <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Factura</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/5">
                {filteredPartSales.map((s) => {
                  const paid = s.status === "completado";
                  return (
                    <tr key={s.id} className="transition hover:bg-ash/60">
                      <td className="px-6 py-4 text-steel">{new Date(s.created_at).toLocaleDateString("es-VE")}</td>
                      <td className="px-6 py-4 font-semibold text-navy">{s.client_name}</td>
                      <td className="px-6 py-4 text-navy">{s.lines.map((l) => partName(l.part_id)).join(", ")}</td>
                      <td className="px-6 py-4 font-semibold text-navy">${s.total.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${paid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
                        >
                          {paid ? "Pagado" : "Pendiente"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {paid ? (
                          <span className="font-semibold text-blue">PDF →</span>
                        ) : (
                          <span className="text-steel">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-navy/10 bg-white">
          {loadingVehicleSales ? (
            <div className="p-12 text-center text-sm text-steel">Cargando ventas...</div>
          ) : filteredVehicleSales.length === 0 ? (
            <div className="p-12 text-center text-sm text-steel">No hay ventas que coincidan.</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-navy/10 bg-ash">
                <tr>
                  <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Fecha</th>
                  <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Cliente</th>
                  <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Vehículo</th>
                  <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Asesor</th>
                  <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Precio final</th>
                  <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Factura</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/5">
                {filteredVehicleSales.map((s) => (
                  <tr key={s.id} className="transition hover:bg-ash/60">
                    <td className="px-6 py-4 text-steel">{new Date(s.created_at).toLocaleDateString("es-VE")}</td>
                    <td className="px-6 py-4 font-semibold text-navy">{s.client_name}</td>
                    <td className="px-6 py-4 text-navy">{vehicleLabel(s.vehicle_id)}</td>
                    <td className="px-6 py-4 text-steel">{advisorName(s.advisor_user_id)}</td>
                    <td className="px-6 py-4 font-display font-bold text-navy">${s.final_price.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-blue">PDF →</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <p className="mt-4 rounded-xl bg-ash px-4 py-3 text-xs text-steel">
        La generación real de factura en PDF todavía no está conectada — el enlace es solo visual por ahora.
      </p>
    </div>
  );
}