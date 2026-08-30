"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePartSales } from "@/hooks/usePartSales";

const STATUS_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  pedido: "Pedido",
  completado: "Completado",
  cancelado: "Cancelado",
};

const STATUS_STYLES: Record<string, string> = {
  pendiente: "bg-amber-100 text-amber-700",
  pedido: "bg-blue-light text-blue",
  completado: "bg-emerald-100 text-emerald-700",
  cancelado: "bg-red-100 text-red-700",
};

const WAREHOUSE_LABELS: Record<string, string> = {
  pendiente: "Buscando repuestos",
  pedido: "Despachando repuestos",
  completado: "Repuestos despachados a mostrador",
  cancelado: "—",
};

export default function PartSalesListView() {
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;

  const [search, setSearch] = useState("");
  const { sales, loading } = usePartSales(filialId, search || undefined);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-navy">Ventas de Repuestos</h1>
          <p className="mt-1 text-sm text-steel">Venta directa de repuestos al público</p>
        </div>
        <Link
          href="/dashboard/repuestos/ventas/nueva"
          className="inline-flex items-center gap-2 rounded-full bg-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy"
        >
          <Plus className="h-4 w-4" />
          Nueva venta
        </Link>
      </div>

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por cliente o número de venta..."
          className="w-full rounded-full border border-navy/15 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
        {loading ? (
          <div className="p-12 text-center text-sm text-steel">Cargando ventas...</div>
        ) : sales.length === 0 ? (
          <div className="p-12 text-center text-sm text-steel">Aún no hay ventas registradas.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-navy/10 bg-ash">
              <tr>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">
                  Venta
                </th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">
                  Cliente
                </th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">
                  Fecha
                </th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">
                  Total
                </th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">
                  Estado
                </th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">
                  Estado de almacén
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {sales.map((s) => (
                <tr key={s.id} className="transition hover:bg-ash/60">
                  <td className="px-6 py-4 font-mono font-semibold text-blue">{s.code}</td>
                  <td className="px-6 py-4 font-medium text-navy">{s.client_name}</td>
                  <td className="px-6 py-4 text-steel">
                    {new Date(s.created_at).toLocaleDateString("es-VE")}
                  </td>
                  <td className="px-6 py-4 font-semibold text-navy">${s.total.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest ${STATUS_STYLES[s.status]}`}
                    >
                      {STATUS_LABELS[s.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-steel">{WAREHOUSE_LABELS[s.status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}