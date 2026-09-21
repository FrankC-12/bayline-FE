"use client";

import { useCallback } from "react";
import {
  listExpenseEntries,
  createExpenseEntry,
  reverseExpenseEntry,
  type CreateExpenseEntryInput,
} from "@/lib/api/administracion";
import type { ExpenseEntry } from "@/types/administracion";
import { useListLoader } from "./useListLoader";

export function useExpenseEntries(filialId: string | null, search?: string) {
  const {
    data: entries,
    setData: setEntries,
    loading,
    error,
    refresh,
  } = useListLoader<ExpenseEntry>(
    () => (filialId ? listExpenseEntries(filialId, search) : Promise.resolve([])),
    [filialId, search]
  );

  const addEntry = useCallback(
    async (input: Omit<CreateExpenseEntryInput, "filial_id">) => {
      if (!filialId) return;
      const created = await createExpenseEntry({ filial_id: filialId, ...input });
      setEntries((prev) => [created, ...prev]);
      return created;
    },
    [filialId, setEntries]
  );

  const reverseEntry = useCallback(
    async (id: string) => {
      const reversal = await reverseExpenseEntry(id);
      setEntries((prev) => [reversal, ...prev]);
      return reversal;
    },
    [setEntries]
  );

  return { entries, loading, error, addEntry, reverseEntry, refresh };
}
