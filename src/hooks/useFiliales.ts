"use client";

import { useCallback } from "react";
import {
  listFiliales,
  createFilial,
  updateFilial,
  setFilialActive,
  type CreateFilialInput,
  type UpdateFilialInput,
} from "@/lib/api/filiales";
import type { Filial } from "@/types/filial";
import { useListLoader } from "./useListLoader";

export function useFiliales(holdingId?: string | null) {
  const {
    data: filiales,
    setData: setFiliales,
    loading,
    error,
    refresh,
  } = useListLoader<Filial>(
    () => (holdingId === null ? Promise.resolve([]) : listFiliales(holdingId ?? undefined)),
    [holdingId]
  );

  const addFilial = useCallback(
    async (input: CreateFilialInput) => {
      const created = await createFilial(input);
      setFiliales((prev) => [created, ...prev]);
      return created;
    },
    [setFiliales]
  );

  const editFilial = useCallback(
    async (id: string, input: UpdateFilialInput) => {
      const updated = await updateFilial(id, input);
      setFiliales((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      return updated;
    },
    [setFiliales]
  );

  const toggleActive = useCallback(
    async (id: string, isActive: boolean) => {
      const updated = await setFilialActive(id, isActive);
      setFiliales((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      return updated;
    },
    [setFiliales]
  );

  return { filiales, loading, error, addFilial, editFilial, toggleActive, refresh };
}
