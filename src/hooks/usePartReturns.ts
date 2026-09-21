"use client";

import { useCallback } from "react";
import { listPartReturns, createPartReturn, type CreatePartReturnInput } from "@/lib/api/parts";
import type { PartReturn } from "@/types/parts";
import { useListLoader } from "./useListLoader";

export function usePartReturns(filialId: string | null) {
  const {
    data: returns,
    setData: setReturns,
    loading,
    error,
    refresh,
  } = useListLoader<PartReturn>(() => (filialId ? listPartReturns(filialId) : Promise.resolve([])), [filialId]);

  const addReturn = useCallback(
    async (input: CreatePartReturnInput) => {
      const created = await createPartReturn(input);
      setReturns((prev) => [created, ...prev]);
      return created;
    },
    [setReturns]
  );

  return { returns, loading, error, addReturn, refresh };
}