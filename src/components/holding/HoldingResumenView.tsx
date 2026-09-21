"use client";

import { useMemo } from "react";
import { FileText, PackageCheck, ShoppingCart, Car, Contact, Users, Warehouse } from "lucide-react";
import { useHoldingDashboardContext } from "@/contexts/HoldingDashboardContext";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";

const usd = (value: number) => `$${value.toLocaleString("es-VE", { minimumFractionDigits: 2 })}`;

export default function HoldingResumenView() {
  const { data, loading, error, refresh } = useHoldingDashboardContext();

  const totals = useMemo(() => {
    const filiales = data?.filiales ?? [];
    return {
      ods: filiales.reduce((sum, f) => sum + f.ods.total, 0),
      odtPendiente: filiales.reduce((sum, f) => sum + f.odt.pendiente, 0),
      ventasRepuestos: filiales.reduce((sum, f) => sum + f.ventas_repuestos.total_usd, 0),
      ventasVehiculos: filiales.reduce((sum, f) => sum + f.ventas_vehiculos.total_usd, 0),
      clientes: filiales.reduce((sum, f) => sum + f.clientes, 0),
      usuarios: filiales.reduce((sum, f) => sum + f.usuarios_total, 0),
      almacenes: filiales.reduce((sum, f) => sum + f.almacenes_total, 0),
    };
  }, [data]);

  const cards = [
    { icon: FileText, label: "ODS totales", value: totals.ods },
    { icon: PackageCheck, label: "ODT pendientes", value: totals.odtPendiente },
    { icon: ShoppingCart, label: "Ventas de repuestos", value: usd(totals.ventasRepuestos) },
    { icon: Car, label: "Ventas de vehículos", value: usd(totals.ventasVehiculos) },
    { icon: Contact, label: "Clientes", value: totals.clientes },
    { icon: Users, label: "Usuarios", value: totals.usuarios },
    { icon: Warehouse, label: "Almacenes", value: totals.almacenes },
  ];

  return (
    <div>
      <div className="mb-8">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-blue">Holding</span>
        <h1 className="mt-2 font-display text-3xl font-bold text-navy">Resumen</h1>
        <p className="mt-1 text-sm text-steel">Totales de todas tus filiales, de un vistazo.</p>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-navy/10 bg-white p-12 text-center text-sm text-steel">
          Cargando...
        </div>
      ) : error ? (
        <ErrorState error={error} onRetry={refresh} />
      ) : !data || data.filiales.length === 0 ? (
        <EmptyState title="Tu holding todavía no tiene filiales." description="Crea una filial para empezar a ver KPIs aquí." />
      ) : (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-2xl border border-navy/10 bg-white p-6">
                <Icon className="mb-3 h-5 w-5 text-blue" />
                <p className="font-mono text-[11px] uppercase tracking-widest text-steel">{label}</p>
                <p className="mt-1 font-display text-2xl font-bold text-navy">{value}</p>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto rounded-2xl border border-navy/10 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-navy/10 bg-ash">
                <tr>
                  <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Filial</th>
                  <th className="px-6 py-3 text-right font-mono text-[11px] uppercase tracking-widest text-steel">ODS</th>
                  <th className="px-6 py-3 text-right font-mono text-[11px] uppercase tracking-widest text-steel">ODT pend.</th>
                  <th className="px-6 py-3 text-right font-mono text-[11px] uppercase tracking-widest text-steel">Vtas. repuestos</th>
                  <th className="px-6 py-3 text-right font-mono text-[11px] uppercase tracking-widest text-steel">Vtas. vehículos</th>
                  <th className="px-6 py-3 text-right font-mono text-[11px] uppercase tracking-widest text-steel">Clientes</th>
                  <th className="px-6 py-3 text-right font-mono text-[11px] uppercase tracking-widest text-steel">Usuarios</th>
                  <th className="px-6 py-3 text-right font-mono text-[11px] uppercase tracking-widest text-steel">Almacenes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/5">
                {data.filiales.map((row) => (
                  <tr key={row.filial_id} className="transition hover:bg-ash/60">
                    <td className="px-6 py-4 font-semibold text-navy">{row.filial_name}</td>
                    <td className="px-6 py-4 text-right text-navy">{row.ods.total}</td>
                    <td className="px-6 py-4 text-right text-navy">{row.odt.pendiente}</td>
                    <td className="px-6 py-4 text-right text-navy">{usd(row.ventas_repuestos.total_usd)}</td>
                    <td className="px-6 py-4 text-right text-navy">{usd(row.ventas_vehiculos.total_usd)}</td>
                    <td className="px-6 py-4 text-right text-navy">{row.clientes}</td>
                    <td className="px-6 py-4 text-right text-navy">{row.usuarios_total}</td>
                    <td className="px-6 py-4 text-right text-navy">{row.almacenes_total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
