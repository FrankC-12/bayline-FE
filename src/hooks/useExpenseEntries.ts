"use client";

import { useCallback, useEffect, useState } from "react";
import { listExpenseEntries, createExpenseEntry } from "@/lib/api/administracion";
import type { ExpenseEntry } from "@/types/administracion";

export function useExpenseEntries(filialId: string | null, search?: string) {
  const [entries, setEntries] = useState<ExpenseEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!filialId) {
      setEntries([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await listExpenseEntries(filialId, search);
    setEntries(data);
    setLoading(false);
  }, [filialId, search]);

  useEffect(() => {
    load();
  }, [load]);

  const addEntry = useCallback(
    async (input: {
      entry_date: string;
      category: string;
      beneficiary: string;
      description: string;
      amount: number;
      currency: string;
      account_id: string;
    }) => {
      if (!filialId) return;
      const created = await createExpenseEntry({ filial_id: filialId, ...input });
      setEntries((prev) => [created, ...prev]);
      return created;
    },
    [filialId]
  );

  return { entries, loading, addEntry, refresh: load };
}