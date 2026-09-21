"use client";

import { useCallback } from "react";
import { listWarehouses, createWarehouse } from "@/lib/api/warehouse";
import type { Warehouse } from "@/types/warehouse";
import { useListLoader } from "./useListLoader";

export function useWarehouses(filialId: string | null) {
  const {
    data: warehouses,
    setData: setWarehouses,
    loading,
    error,
    refresh,
  } = useListLoader<Warehouse>(() => (filialId ? listWarehouses(filialId) : Promise.resolve([])), [filialId]);

  const addWarehouse = useCallback(
    async (name: string) => {
      if (!filialId) return;
      const created = await createWarehouse(filialId, name);
      setWarehouses((prev) => [...prev, created]);
      return created;
    },
    [filialId, setWarehouses]
  );

  return { warehouses, loading, error, addWarehouse, refresh };
}
