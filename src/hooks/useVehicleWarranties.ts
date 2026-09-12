"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listVehicleWarranties,
  createVehicleWarranty,
  bulkCreateVehicleWarranties,
  type CreateVehicleWarrantyInput,
  type BulkVehicleWarrantyItem,
} from "@/lib/api/vehicleWarranties";
import type { VehicleWarranty } from "@/types/vehicleWarranty";

export function useVehicleWarranties(filialId: string | null, search?: string) {
  const [warranties, setWarranties] = useState<VehicleWarranty[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!filialId) {
      setWarranties([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await listVehicleWarranties(filialId, search);
    setWarranties(data);
    setLoading(false);
  }, [filialId, search]);

  useEffect(() => {
    load();
  }, [load]);

  const addWarranty = useCallback(
    async (input: Omit<CreateVehicleWarrantyInput, "filial_id">) => {
      if (!filialId) return;
      const created = await createVehicleWarranty({ filial_id: filialId, ...input });
      setWarranties((prev) => [created, ...prev]);
      return created;
    },
    [filialId]
  );

  const importBulk = useCallback(
    async (items: BulkVehicleWarrantyItem[]) => {
      if (!filialId) throw new Error("Selecciona una filial.");
      const result = await bulkCreateVehicleWarranties(filialId, items);
      setWarranties((prev) => [...result.created, ...prev]);
      return result;
    },
    [filialId]
  );

  return { warranties, loading, addWarranty, importBulk, refresh: load };
}
