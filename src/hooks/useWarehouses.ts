"use client";

import { useCallback, useEffect, useState } from "react";
import { listWarehouses, createWarehouse } from "@/lib/api/warehouse";
import type { Warehouse } from "@/types/warehouse";

export function useWarehouses(filialId: string | null) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!filialId) {
      setWarehouses([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await listWarehouses(filialId);
    setWarehouses(data);
    setLoading(false);
  }, [filialId]);

  useEffect(() => {
    load();
  }, [load]);

  const addWarehouse = useCallback(
    async (name: string) => {
      if (!filialId) return;
      const created = await createWarehouse(filialId, name);
      setWarehouses((prev) => [...prev, created]);
      return created;
    },
    [filialId]
  );

  return { warehouses, loading, addWarehouse, refresh: load };
}