"use client";

import { usePartAvailability } from "@/hooks/usePartAvailability";
import type { Warehouse } from "@/types/warehouse";

interface PartAvailabilityHintProps {
  filialId: string;
  partId: string;
  warehouses: Warehouse[];
  originWarehouseId?: string;
}

/** "Disponible en cada almacén" for the part just picked on a line — read
 * only, informational (a transfer's stock isn't actually checked until it's
 * completed, same convention as elsewhere in the app: this never blocks). */
export default function PartAvailabilityHint({
  filialId,
  partId,
  warehouses,
  originWarehouseId,
}: PartAvailabilityHintProps) {
  const { rows, loading } = usePartAvailability(filialId, partId);

  if (loading) {
    return <p className="mt-1 text-xs text-steel">Consultando disponibilidad...</p>;
  }

  const quantityByWarehouse = new Map(rows.map((r) => [r.warehouse_id, r.quantity]));

  return (
    <p className="mt-1 text-xs text-steel">
      Disponible:{" "}
      {warehouses.map((w, i) => (
        <span key={w.id}>
          {i > 0 && " · "}
          <span className={w.id === originWarehouseId ? "font-semibold text-navy" : undefined}>
            {w.name}: {quantityByWarehouse.get(w.id) ?? 0}
          </span>
        </span>
      ))}
    </p>
  );
}
