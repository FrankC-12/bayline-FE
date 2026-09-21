"use client";

import { useCallback } from "react";
import {
  listHoldings,
  createHolding,
  updateHolding,
  setHoldingActive,
  type CreateHoldingInput,
  type UpdateHoldingInput,
} from "@/lib/api/holding";
import type { Holding } from "@/types/holding";
import { useListLoader } from "./useListLoader";

export function useHoldings() {
  const {
    data: holdings,
    setData: setHoldings,
    loading,
    error,
    refresh,
  } = useListLoader<Holding>(() => listHoldings(), []);

  const addHolding = useCallback(
    async (input: CreateHoldingInput) => {
      const created = await createHolding(input);
      setHoldings((prev) => [created, ...prev]);
      return created;
    },
    [setHoldings]
  );

  const editHolding = useCallback(
    async (id: string, input: UpdateHoldingInput) => {
      const updated = await updateHolding(id, input);
      setHoldings((prev) => prev.map((h) => (h.id === updated.id ? updated : h)));
      return updated;
    },
    [setHoldings]
  );

  const toggleActive = useCallback(
    async (id: string, isActive: boolean) => {
      const updated = await setHoldingActive(id, isActive);
      setHoldings((prev) => prev.map((h) => (h.id === updated.id ? updated : h)));
      return updated;
    },
    [setHoldings]
  );

  return { holdings, loading, error, addHolding, editHolding, toggleActive, refresh };
}
