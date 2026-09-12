"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listIncomeEntries,
  createIncomeEntry,
  reverseIncomeEntry,
  type CreateIncomeEntryInput,
} from "@/lib/api/administracion";
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
    async (input: Omit<CreateIncomeEntryInput, "filial_id">) => {
      if (!filialId) return;
      const created = await createIncomeEntry({ filial_id: filialId, ...input });
      setEntries((prev) => [created, ...prev]);
      return created;
    },
    [filialId]
  );

  const reverseEntry = useCallback(async (id: string) => {
    const reversal = await reverseIncomeEntry(id);
    setEntries((prev) => [reversal, ...prev]);
    return reversal;
  }, []);

  return { entries, loading, addEntry, reverseEntry, refresh: load };
}
