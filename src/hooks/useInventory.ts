"use client";

import { useCallback, useEffect, useState } from "react";
import { getInventory, updateInventoryLocation } from "@/lib/api/warehouse";
import type { InventoryRow } from "@/types/warehouse";

export function useInventory(filialId: string | null, warehouseId?: string, search?: string) {
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!filialId) {
      setInventory([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await getInventory(filialId, warehouseId, search);
    setInventory(data);
    setLoading(false);
  }, [filialId, warehouseId, search]);

  useEffect(() => {
    load();
  }, [load]);

  const editLocation = useCallback(
    async (partId: string, rowWarehouseId: string, location: string | null) => {
      if (!filialId) return;
      const updated = await updateInventoryLocation(filialId, partId, rowWarehouseId, location);
      setInventory((prev) =>
        prev.map((row) =>
          row.part_id === updated.part_id && row.warehouse_id === updated.warehouse_id ? updated : row
        )
      );
    },
    [filialId]
  );

  return { inventory, loading, refresh: load, editLocation };
}