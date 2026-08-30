"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useVehicles } from "@/hooks/useVehicles";
import { useUsers } from "@/hooks/useUser";
import { listVehicleSales } from "@/lib/api/concesionario";
import type { VehicleSale } from "@/types/concesionario";

export default function VehicleSalesView() {
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;

  const { vehicles } = useVehicles(filialId);
  const { users } = useUsers({ filialId });
  const [sales, setSales] = useState<VehicleSale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!filialId) return;
    setLoading(true);
    listVehicleSales(filialId).then((data) => {
      setSales(data);
      setLoading(false);
    });
  }, [filialId]);

  const vehicleLabel = (id: string) => {
    const v = vehicles.find((x) => x.id === id);
    return v ? `${v.brand} ${v.model} ${v.year}` : "—";
  };
  const advisorName = (id: string | null) => (id ? users.find((u) => u.id === id)?.full_name ?? "—" : "—");

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-navy">Ventas de Vehículos</h1>
      <p className="mt-1 text-sm text-steel">
        Se generan automáticamente al marcar un vehículo como &quot;Vendido&quot; en el Dashboard
      </p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-navy/10 bg-white">
        {loading ? (
          <div className="p-12 text-center text-sm text-steel">Cargando ventas...</div>
        ) : sales.length === 0 ? (
          <div className="p-12 text-center text-sm text-steel">Todavía no hay ventas registradas.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-navy/10 bg-ash">
              <tr>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Fecha</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Cliente</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Vehículo</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Asesor</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Tipo</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Precio final</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {sales.map((s) => (
                <tr key={s.id} className="transition hover:bg-ash/60">
                  <td className="px-6 py-4 text-steel">{new Date(s.created_at).toLocaleDateString("es-VE")}</td>
                  <td className="px-6 py-4 font-semibold text-navy">{s.client_name}</td>
                  <td className="px-6 py-4 text-navy">{vehicleLabel(s.vehicle_id)}</td>
                  <td className="px-6 py-4 text-steel">{advisorName(s.advisor_user_id)}</td>
                  <td className="px-6 py-4 text-steel capitalize">{s.sale_type}</td>
                  <td className="px-6 py-4 font-display font-bold text-navy">${s.final_price.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}