"use client";

import { useCallback, useEffect, useState } from "react";
import { listIncomeEntries, createIncomeEntry } from "@/lib/api/administracion";
import type { IncomeEntry } from "@/types/administracion";

export function useIncomeEntries(filialId: string | null, search?: string) {
  const [entries, setEntries] = useState<IncomeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!filialId) {
      setEntries([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await listIncomeEntries(filialId, search);
    setEntries(data);
    setLoading(false);
  }, [filialId, search]);

  useEffect(() => {
    load();
  }, [load]);

  const addEntry = useCallback(
    async (input: { entry_date: string; description: string; amount: number; currency: string; account_id: string }) => {
      if (!filialId) return;
      const created = await createIncomeEntry({ filial_id: filialId, ...input });
      setEntries((prev) => [created, ...prev]);
      return created;
    },
    [filialId]
  );

  return { entries, loading, addEntry, refresh: load };
}