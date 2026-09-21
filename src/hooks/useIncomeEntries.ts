"use client";

import { useCallback } from "react";
import {
  listIncomeEntries,
  createIncomeEntry,
  reverseIncomeEntry,
  type CreateIncomeEntryInput,
} from "@/lib/api/administracion";
import type { IncomeEntry } from "@/types/administracion";
import { useListLoader } from "./useListLoader";

export function useIncomeEntries(filialId: string | null, search?: string) {
  const {
    data: entries,
    setData: setEntries,
    loading,
    error,
    refresh,
  } = useListLoader<IncomeEntry>(
    () => (filialId ? listIncomeEntries(filialId, search) : Promise.resolve([])),
    [filialId, search]
  );

  const addEntry = useCallback(
    async (input: Omit<CreateIncomeEntryInput, "filial_id">) => {
      if (!filialId) return;
      const created = await createIncomeEntry({ filial_id: filialId, ...input });
      setEntries((prev) => [created, ...prev]);
      return created;
    },
    [filialId, setEntries]
  );

  const reverseEntry = useCallback(
    async (id: string) => {
      const reversal = await reverseIncomeEntry(id);
      setEntries((prev) => [reversal, ...prev]);
      return reversal;
    },
    [setEntries]
  );

  return { entries, loading, error, addEntry, reverseEntry, refresh };
}
