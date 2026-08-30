"use client";

import { useCallback, useEffect, useState } from "react";
import { getInventory } from "@/lib/api/warehouse";
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

  return { inventory, loading, refresh: load };
}