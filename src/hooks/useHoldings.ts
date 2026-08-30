"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listHoldings,
  createHolding,
  updateHolding,
  setHoldingActive,
  type CreateHoldingInput,
  type UpdateHoldingInput,
} from "@/lib/api/holding";
import type { Holding } from "@/types/holding";

export function useHoldings() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await listHoldings();
    setHoldings(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addHolding = useCallback(async (input: CreateHoldingInput) => {
    const created = await createHolding(input);
    setHoldings((prev) => [created, ...prev]);
    return created;
  }, []);

  const editHolding = useCallback(async (id: string, input: UpdateHoldingInput) => {
    const updated = await updateHolding(id, input);
    setHoldings((prev) => prev.map((h) => (h.id === updated.id ? updated : h)));
    return updated;
  }, []);

  const toggleActive = useCallback(async (id: string, isActive: boolean) => {
    const updated = await setHoldingActive(id, isActive);
    setHoldings((prev) => prev.map((h) => (h.id === updated.id ? updated : h)));
    return updated;
  }, []);

  return { holdings, loading, addHolding, editHolding, toggleActive, refresh: load };
}