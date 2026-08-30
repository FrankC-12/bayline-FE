"use client";

import { useCallback, useEffect, useState } from "react";
import { listPartReturns, createPartReturn, type CreatePartReturnInput } from "@/lib/api/parts";
import type { PartReturn } from "@/types/parts";

export function usePartReturns(filialId: string | null) {
  const [returns, setReturns] = useState<PartReturn[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!filialId) {
      setReturns([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await listPartReturns(filialId);
    setReturns(data);
    setLoading(false);
  }, [filialId]);

  useEffect(() => {
    load();
  }, [load]);

  const addReturn = useCallback(async (input: CreatePartReturnInput) => {
    const created = await createPartReturn(input);
    setReturns((prev) => [created, ...prev]);
    return created;
  }, []);

  return { returns, loading, addReturn, refresh: load };
}