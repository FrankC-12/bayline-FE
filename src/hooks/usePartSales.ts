"use client";

import { useCallback, useEffect, useState } from "react";
import { listPartSales, createPartSale, type CreatePartSaleInput } from "@/lib/api/parts";
import type { PartSale } from "@/types/parts";

export function usePartSales(filialId: string | null, search?: string) {
  const [sales, setSales] = useState<PartSale[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!filialId) {
      setSales([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await listPartSales(filialId, search);
    setSales(data);
    setLoading(false);
  }, [filialId, search]);

  useEffect(() => {
    load();
  }, [load]);

  const addSale = useCallback(async (input: CreatePartSaleInput) => {
    const created = await createPartSale(input);
    setSales((prev) => [created, ...prev]);
    return created;
  }, []);

  return { sales, loading, addSale, refresh: load };
}