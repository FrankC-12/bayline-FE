"use client";

import { useCallback } from "react";
import {
  listVehicleWarranties,
  createVehicleWarranty,
  bulkCreateVehicleWarranties,
  type CreateVehicleWarrantyInput,
  type BulkVehicleWarrantyItem,
} from "@/lib/api/vehicleWarranties";
import type { VehicleWarranty } from "@/types/vehicleWarranty";
import { useListLoader } from "./useListLoader";

export function useVehicleWarranties(filialId: string | null, search?: string) {
  const {
    data: warranties,
    setData: setWarranties,
    loading,
    error,
    refresh,
  } = useListLoader<VehicleWarranty>(
    () => (filialId ? listVehicleWarranties(filialId, search) : Promise.resolve([])),
    [filialId, search]
  );

  const addWarranty = useCallback(
    async (input: Omit<CreateVehicleWarrantyInput, "filial_id">) => {
      if (!filialId) return;
      const created = await createVehicleWarranty({ filial_id: filialId, ...input });
      setWarranties((prev) => [created, ...prev]);
      return created;
    },
    [filialId, setWarranties]
  );

  const importBulk = useCallback(
    async (items: BulkVehicleWarrantyItem[]) => {
      if (!filialId) throw new Error("Selecciona una filial.");
      const result = await bulkCreateVehicleWarranties(filialId, items);
      setWarranties((prev) => [...result.created, ...prev]);
      return result;
    },
    [filialId, setWarranties]
  );

  return { warranties, loading, error, addWarranty, importBulk, refresh };
}
