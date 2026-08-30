"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { formatElapsed } from "@/lib/time";
import type { ServiceOrder } from "@/types/serviceOrder";
import type { VehicleLookupEntry } from "@/hooks/useVehicleLookUp";

interface OrderCardProps {
  order: ServiceOrder;
  info: VehicleLookupEntry | undefined;
  technicianName: string;
}

const TYPE_LABELS: Record<string, string> = { regular: "Regular", mpt: "MPT" };

export default function OrderCard({ order, info, technicianName }: OrderCardProps) {
  const [elapsed, setElapsed] = useState(() => formatElapsed(order.created_at, order.closed_at));

  useEffect(() => {
    if (order.closed_at) return;
    const interval = setInterval(() => setElapsed(formatElapsed(order.created_at)), 60000);
    return () => clearInterval(interval);
  }, [order.created_at, order.closed_at]);

  return (
    <div className="w-full rounded-2xl border border-l-4 border-navy/10 border-l-blue bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm font-bold text-blue">{order.code}</span>
        <span className="rounded-full bg-ash px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-steel">
          {TYPE_LABELS[order.order_type] ?? order.order_type}
        </span>
      </div>

      <p className="mt-2 font-display font-bold text-navy">
        {info ? `${info.vehicle.brand} ${info.vehicle.model}` : "Vehículo"}
      </p>
      <p className="font-mono text-xs text-steel">{info?.vehicle.plate}</p>
      <p className="mt-1 text-sm text-steel">{info?.client.full_name ?? "Cliente"}</p>

      <div className="mt-4 flex items-center justify-between border-t border-navy/10 pt-3 text-sm">
        <span className="text-steel">{technicianName || "Sin asignar"}</span>
        <span className="flex items-center gap-1 font-mono text-xs text-blue">
          <Clock className="h-3.5 w-3.5" />
          {elapsed}
        </span>
      </div>
    </div>
  );
}