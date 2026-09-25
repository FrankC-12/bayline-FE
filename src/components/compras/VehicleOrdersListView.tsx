"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useVehiclePurchaseOrders } from "@/hooks/useVehiclePurchaseOrders";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import type { VehiclePurchaseOrderStatus } from "@/types/compras";

const STATUS_LABELS: Record<VehiclePurchaseOrderStatus, string> = {
  enviada: "Enviada, esperando recepción",
  parcialmente_recibida: "Parcialmente recibida",
  recibida: "Recibida",
  conciliada: "Conciliada",
  cancelada: "Cancelada",
};

const STATUS_STYLES: Record<VehiclePurchaseOrderStatus, string> = {
  enviada: "bg-slate-100 text-slate-600",
  parcialmente_recibida: "bg-amber-100 text-amber-700",
  recibida: "bg-blue-light text-blue",
  conciliada: "bg-emerald-100 text-emerald-700",
  cancelada: "bg-red-100 text-red-700",
};

export default function VehicleOrdersListView() {
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;
  const router = useRouter();

  const { suppliers } = useSuppliers(filialId);
  const { orders, loading, error, refresh } = useVehiclePurchaseOrders(filialId);
  const supplierName = (id: string) => suppliers.find((s) => s.id === id)?.business_name ?? "—";

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold text-navy">Compra de Vehículos</h1>
        <Link
          href="/dashboard/compras/vehiculos/nueva"
          className="inline-flex items-center gap-2 rounded-full bg-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy"
        >
          <Plus className="h-4 w-4" />
          Nueva orden de compra
        </Link>
      </div>
      <p className="mb-4 text-sm text-steel">Órdenes de compra de vehículos a importadores y marcas</p>

      <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
        {loading ? (
          <div className="p-12 text-center text-sm text-steel">Cargando órdenes de compra...</div>
        ) : error ? (
          <ErrorState error={error} onRetry={refresh} compact />
        ) : orders.length === 0 ? (
          <EmptyState compact title="No hay órdenes de compra de vehículos todavía." />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-navy/10 bg-ash">
              <tr>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">N.º Orden</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Proveedor</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Fecha</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Unidades</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {orders.map((o) => {
                const ordered = o.lines.reduce((sum, l) => sum + l.quantity, 0);
                const received = o.lines.reduce((sum, l) => sum + l.quantity_received, 0);
                return (
                  <tr
                    key={o.id}
                    className="cursor-pointer transition hover:bg-ash/60"
                    onClick={() => router.push(`/dashboard/compras/vehiculos/${o.id}`)}
                  >
                    <td className="px-6 py-4 font-mono font-semibold text-blue">{o.code}</td>
                    <td className="px-6 py-4 font-medium text-navy">{supplierName(o.supplier_id)}</td>
                    <td className="px-6 py-4 text-steel">{new Date(o.created_at).toLocaleDateString("es-VE")}</td>
                    <td className="px-6 py-4 text-navy">
                      {received} / {ordered}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest ${STATUS_STYLES[o.status]}`}
                      >
                        {STATUS_LABELS[o.status]}
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
