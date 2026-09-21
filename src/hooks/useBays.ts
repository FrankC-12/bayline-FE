"use client";

import { useCallback } from "react";
import { listBays, createBay, updateBay } from "@/lib/api/serviceOrders";
import type { Bay } from "@/types/serviceOrder";
import { useListLoader } from "./useListLoader";

export function useBays(filialId: string | null) {
  const {
    data: bays,
    setData: setBays,
    loading,
    error,
    refresh,
  } = useListLoader<Bay>(() => (filialId ? listBays(filialId) : Promise.resolve([])), [filialId]);

  const addBay = useCallback(
    async (name: string) => {
      if (!filialId) return;
      const created = await createBay(filialId, name);
      setBays((prev) => [...prev, created]);
      return created;
    },
    [filialId, setBays]
  );

  const toggleActive = useCallback(
    async (bay: Bay) => {
      const updated = await updateBay(bay.id, { is_active: !bay.is_active });
      setBays((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      return updated;
    },
    [setBays]
  );

  const renameBay = useCallback(
    async (bay: Bay, name: string) => {
      const updated = await updateBay(bay.id, { name });
      setBays((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      return updated;
    },
    [setBays]
  );

  return { bays, loading, error, addBay, toggleActive, renameBay, refresh };
}
