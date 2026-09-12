"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listExpenseEntries,
  createExpenseEntry,
  reverseExpenseEntry,
  type CreateExpenseEntryInput,
} from "@/lib/api/administracion";
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
    async (input: Omit<CreateExpenseEntryInput, "filial_id">) => {
      if (!filialId) return;
      const created = await createExpenseEntry({ filial_id: filialId, ...input });
      setEntries((prev) => [created, ...prev]);
      return created;
    },
    [filialId]
  );

  const reverseEntry = useCallback(async (id: string) => {
    const reversal = await reverseExpenseEntry(id);
    setEntries((prev) => [reversal, ...prev]);
    return reversal;
  }, []);

  return { entries, loading, addEntry, reverseEntry, refresh: load };
}
