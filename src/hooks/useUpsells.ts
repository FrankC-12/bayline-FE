"use client";

import { useCallback } from "react";
import { listUpsells, createUpsell, decideUpsell, type CreateUpsellInput, type DecideUpsellInput } from "@/lib/api/upsells";
import type { Upsell } from "@/types/upsells";
import { useListLoader } from "./useListLoader";

export function useUpsells(filialId: string | null) {
  const {
    data: upsells,
    setData: setUpsells,
    loading,
    error,
    refresh,
  } = useListLoader<Upsell>(() => (filialId ? listUpsells(filialId) : Promise.resolve([])), [filialId]);

  const addUpsell = useCallback(
    async (orderId: string, input: CreateUpsellInput) => {
      const created = await createUpsell(orderId, input);
      setUpsells((prev) => [created, ...prev]);
      return created;
    },
    [setUpsells]
  );

  const decide = useCallback(
    async (upsellId: string, input: DecideUpsellInput) => {
      const updated = await decideUpsell(upsellId, input);
      setUpsells((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      return updated;
    },
    [setUpsells]
  );

  return { upsells, loading, error, addUpsell, decide, refresh };
}
