"use client";

import { useCallback, useEffect, useState } from "react";
import { listAccounts, createAccount, updateAccount } from "@/lib/api/administracion";
import type { Account } from "@/types/administracion";

export function useAccounts(filialId: string | null) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!filialId) {
      setAccounts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await listAccounts(filialId);
    setAccounts(data);
    setLoading(false);
  }, [filialId]);

  useEffect(() => {
    load();
  }, [load]);

  const addAccount = useCallback(
    async (input: { name: string; bank?: string | null; currency: string; account_type: string }) => {
      if (!filialId) return;
      const created = await createAccount({ filial_id: filialId, ...input });
      setAccounts((prev) => [...prev, created]);
      return created;
    },
    [filialId]
  );

  const editAccount = useCallback(async (id: string, input: { name?: string; bank?: string | null; is_active?: boolean }) => {
    const updated = await updateAccount(id, input);
    setAccounts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    return updated;
  }, []);

  return { accounts, loading, addAccount, editAccount, refresh: load };
}