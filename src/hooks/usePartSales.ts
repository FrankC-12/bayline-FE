"use client";

import { useCallback } from "react";
import { listPartSales, createPartSale, type CreatePartSaleInput } from "@/lib/api/parts";
import type { PartSale } from "@/types/parts";
import { useListLoader } from "./useListLoader";

export function usePartSales(filialId: string | null, search?: string) {
  const {
    data: sales,
    setData: setSales,
    loading,
    error,
    refresh,
  } = useListLoader<PartSale>(
    () => (filialId ? listPartSales(filialId, search) : Promise.resolve([])),
    [filialId, search]
  );

  const addSale = useCallback(
    async (input: CreatePartSaleInput) => {
      const created = await createPartSale(input);
      setSales((prev) => [created, ...prev]);
      return created;
    },
    [setSales]
  );

  return { sales, loading, error, addSale, refresh };
}