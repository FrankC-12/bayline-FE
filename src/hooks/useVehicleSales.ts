"use client";

import { useCallback, useEffect, useState } from "react";
import { listVehicleSales } from "@/lib/api/concesionario";
import type { VehicleSale } from "@/types/concesionario";

export function useVehicleSales(filialId: string | null) {
  const [sales, setSales] = useState<VehicleSale[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!filialId) {
      setSales([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await listVehicleSales(filialId);
    setSales(data);
    setLoading(false);
  }, [filialId]);

  useEffect(() => {
    load();
  }, [load]);

  return { sales, loading, refresh: load };
}