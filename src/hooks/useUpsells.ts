"use client";

import { useCallback, useEffect, useState } from "react";
import { listUpsells, createUpsell, updateUpsellStatus, type CreateUpsellInput } from "@/lib/api/upsells";
import type { Upsell } from "@/types/upsells";

export function useUpsells(filialId: string | null) {
  const [upsells, setUpsells] = useState<Upsell[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!filialId) {
      setUpsells([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await listUpsells(filialId);
    setUpsells(data);
    setLoading(false);
  }, [filialId]);

  useEffect(() => {
    load();
  }, [load]);

  const addUpsell = useCallback(async (orderId: string, input: CreateUpsellInput) => {
    const created = await createUpsell(orderId, input);
    setUpsells((prev) => [created, ...prev]);
    return created;
  }, []);

  const setStatus = useCallback(async (upsellId: string, status: string) => {
    const updated = await updateUpsellStatus(upsellId, status);
    setUpsells((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    return updated;
  }, []);

  return { upsells, loading, addUpsell, setStatus, refresh: load };
}