"use client";

import { getVehicleMileageHistory } from "@/lib/api/clients";
import type { VehicleMileageHistoryEntry } from "@/types/client";
import { useListLoader } from "./useListLoader";

export function useVehicleMileageHistory(vehicleId: string | null) {
  const {
    data: history,
    loading,
    error,
    refresh,
  } = useListLoader<VehicleMileageHistoryEntry>(
    () => (vehicleId ? getVehicleMileageHistory(vehicleId) : Promise.resolve([])),
    [vehicleId]
  );

  return { history, loading, error, refresh };
}
