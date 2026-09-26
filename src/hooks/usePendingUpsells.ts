"use client";

import { useCallback } from "react";
import { getPendingUpsellsForVehicle } from "@/lib/api/upsells";
import type { PendingUpsell } from "@/types/upsells";
import { useListLoader } from "./useListLoader";

/** Pending/postponed recommendations for this vehicle from OTHER visits —
 * the persistent "recomendaciones pendientes" block on an ODS. */
export function usePendingUpsells(vehicleId: string | null, excludeOrderId?: string) {
  const {
    data: pendingUpsells,
    setData: setPendingUpsells,
    loading,
    error,
    refresh,
  } = useListLoader<PendingUpsell>(
    () => (vehicleId ? getPendingUpsellsForVehicle(vehicleId, excludeOrderId) : Promise.resolve([])),
    [vehicleId, excludeOrderId]
  );

  const remove = useCallback(
    (upsellId: string) => setPendingUpsells((prev) => prev.filter((u) => u.id !== upsellId)),
    [setPendingUpsells]
  );

  return { pendingUpsells, loading, error, refresh, remove };
}
