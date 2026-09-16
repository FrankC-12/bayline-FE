"use client";

import { useCallback, useEffect, useState } from "react";
import { getVehicleMileageHistory } from "@/lib/api/clients";
import type { VehicleMileageHistoryEntry } from "@/types/client";

export function useVehicleMileageHistory(vehicleId: string | null) {
  const [history, setHistory] = useState<VehicleMileageHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!vehicleId) {
      setHistory([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await getVehicleMileageHistory(vehicleId);
    setHistory(data);
    setLoading(false);
  }, [vehicleId]);

  useEffect(() => {
    load();
  }, [load]);

  return { history, loading, refresh: load };
}
