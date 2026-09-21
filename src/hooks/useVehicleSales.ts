"use client";

import { listVehicleSales } from "@/lib/api/concesionario";
import type { VehicleSale } from "@/types/concesionario";
import { useListLoader } from "./useListLoader";

export function useVehicleSales(filialId: string | null) {
  const {
    data: sales,
    loading,
    error,
    refresh,
  } = useListLoader<VehicleSale>(() => (filialId ? listVehicleSales(filialId) : Promise.resolve([])), [filialId]);

  return { sales, loading, error, refresh };
}
