"use client";

import { useEffect } from "react";
import { listPartSaleRequests } from "@/lib/api/warehouse";
import { useListLoader } from "./useListLoader";
import type { PartSaleRequest } from "@/types/warehouse";

export function usePartSaleRequests(filialId: string | null) {
  const { data: requests, loading, error, refresh } = useListLoader<PartSaleRequest>(
    () => filialId ? listPartSaleRequests(filialId) : Promise.resolve([]), [filialId]
  );
  useEffect(() => {
    if (!filialId) return;
    const id = setInterval(() => void refresh(), 30000);
    return () => clearInterval(id);
  }, [filialId, refresh]);
  return { requests, loading, error, refresh };
}
