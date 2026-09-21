"use client";

import { useCallback } from "react";
import { listAccounts, createAccount, updateAccount } from "@/lib/api/administracion";
import type { Account } from "@/types/administracion";
import { useListLoader } from "./useListLoader";

export function useAccounts(filialId: string | null) {
  const {
    data: accounts,
    setData: setAccounts,
    loading,
    error,
    refresh,
  } = useListLoader<Account>(() => (filialId ? listAccounts(filialId) : Promise.resolve([])), [filialId]);

  const addAccount = useCallback(
    async (input: { name: string; bank?: string | null; currency: string; account_type: string; opening_balance?: number }) => {
      if (!filialId) return;
      const created = await createAccount({ filial_id: filialId, ...input });
      setAccounts((prev) => [...prev, created]);
      return created;
    },
    [filialId, setAccounts]
  );

  const editAccount = useCallback(
    async (id: string, input: { name?: string; bank?: string | null; is_active?: boolean }) => {
      const updated = await updateAccount(id, input);
      setAccounts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      return updated;
    },
    [setAccounts]
  );

  return { accounts, loading, error, addAccount, editAccount, refresh };
}
