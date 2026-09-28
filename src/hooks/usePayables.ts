"use client";

import { useCallback } from "react";
import { listPayables } from "@/lib/api/administracion";
import type { Payable } from "@/types/administracion";
import { useListLoader } from "./useListLoader";

export function usePayables(filialId: string | null) {
  const {
    data: payables,
    setData: setPayables,
    loading,
    error,
    refresh,
  } = useListLoader<Payable>(() => (filialId ? listPayables(filialId) : Promise.resolve([])), [filialId]);

  const removePaid = useCallback(
    (purchaseRequestId: string) =>
      setPayables((prev) => prev.filter((p) => p.purchase_request_id !== purchaseRequestId)),
    [setPayables]
  );

  return { payables, loading, error, refresh, removePaid };
}
