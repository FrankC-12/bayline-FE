"use client";

import { useCallback, useEffect, useState } from "react";
import { listBays, createBay, updateBay } from "@/lib/api/serviceOrders";
import type { Bay } from "@/types/serviceOrder";

export function useBays(filialId: string | null) {
  const [bays, setBays] = useState<Bay[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!filialId) {
      setBays([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await listBays(filialId);
    setBays(data);
    setLoading(false);
  }, [filialId]);

  useEffect(() => {
    load();
  }, [load]);

  const addBay = useCallback(
    async (name: string) => {
      if (!filialId) return;
      const created = await createBay(filialId, name);
      setBays((prev) => [...prev, created]);
      return created;
    },
    [filialId]
  );

  const toggleActive = useCallback(async (bay: Bay) => {
    const updated = await updateBay(bay.id, { is_active: !bay.is_active });
    setBays((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    return updated;
  }, []);

  return { bays, loading, addBay, toggleActive, refresh: load };
}