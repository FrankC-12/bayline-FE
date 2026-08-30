"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useServiceOrders } from "@/hooks/useServiceOrders";
import { useVehicleLookup } from "@/hooks/useVehicleLookUp";
import { useUsers } from "@/hooks/useUser";
import { updateInspection } from "@/lib/api/inspections";
import type { ServiceOrder, ServiceOrderStatus } from "@/types/serviceOrder";
import OrderCard from "./OrderCard";
import CreateOrderPanel from "./CreateOrderPanel";

const COLUMNS: { status: ServiceOrderStatus; label: string; dot: string }[] = [
  { status: "pendiente", label: "Pendiente", dot: "bg-amber-500" },
  { status: "en_progreso", label: "En progreso", dot: "bg-blue" },
  { status: "completado", label: "Completado", dot: "bg-emerald-500" },
];

export default function OrdersBoard() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;

  const { orders, loading, addOrder } = useServiceOrders(filialId, "active");
  const { vehicleMap } = useVehicleLookup(filialId);
  const { users } = useUsers({ filialId });
  const [panelOpen, setPanelOpen] = useState(false);

  const technicianName = (id: string | null) => users.find((u) => u.id === id)?.full_name ?? "";

  const byStatus = useMemo(() => {
    const grouped: Record<string, ServiceOrder[]> = { pendiente: [], en_progreso: [], completado: [] };
    for (const o of orders) {
      grouped[o.status]?.push(o);
    }
    return grouped;
  }, [orders]);

  async function handleCreate(vehicleId: string, orderType: "regular" | "mpt", inspectionId?: string) {
    if (!filialId) return;
    const created = await addOrder({ filial_id: filialId, vehicle_id: vehicleId, order_type: orderType });
    if (inspectionId) {
      await updateInspection(inspectionId, { service_order_id: created.id });
    }
    router.push(`/dashboard/servicios/${created.id}`);
  }

  if (!filialId) return null;

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-navy">Órdenes de Servicio</h1>
          <p className="mt-1 text-sm text-steel">Núcleo del flujo del taller · contadores en tiempo real</p>
        </div>
        <button
          onClick={() => setPanelOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy"
        >
          <Plus className="h-4 w-4" />
          Crear ODS
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-navy/10 bg-white p-12 text-center text-sm text-steel">
          Cargando órdenes...
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {COLUMNS.map((col) => (
            <div key={col.status}>
              <div className="mb-3 flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${col.dot}`} />
                <span className="font-mono text-xs font-bold uppercase tracking-widest text-navy">
                  {col.label}
                </span>
                <span className="rounded-full bg-navy/10 px-2 py-0.5 text-xs font-bold text-navy">
                  {byStatus[col.status]?.length ?? 0}
                </span>
              </div>
              <div className="space-y-3">
                {byStatus[col.status]?.map((o) => (
                  <Link key={o.id} href={`/dashboard/servicios/${o.id}`} className="block">
                    <OrderCard
                      order={o}
                      info={vehicleMap.get(o.vehicle_id)}
                      technicianName={technicianName(o.technician_user_id)}
                    />
                  </Link>
                ))}
                {byStatus[col.status]?.length === 0 && (
                  <p className="rounded-xl border border-dashed border-navy/15 p-4 text-center text-xs text-steel">
                    Sin órdenes
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateOrderPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        filialId={filialId}
        onSubmit={handleCreate}
      />
    </div>
  );
}