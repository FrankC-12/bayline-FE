"use client";

import { useCallback } from "react";
import {
  listPurchaseRequests,
  createPurchaseRequest,
  updatePurchaseRequestStatus,
} from "@/lib/api/administracion";
import type { PurchaseRequest } from "@/types/administracion";
import { useListLoader } from "./useListLoader";

export function usePurchaseRequests(filialId: string | null, search?: string) {
  const {
    data: requests,
    setData: setRequests,
    loading,
    error,
    refresh,
  } = useListLoader<PurchaseRequest>(
    () => (filialId ? listPurchaseRequests(filialId, search) : Promise.resolve([])),
    [filialId, search]
  );

  const addRequest = useCallback(
    async (supplierId: string, lines: { part_id: string; quantity: number }[]) => {
      if (!filialId) return;
      const created = await createPurchaseRequest({ filial_id: filialId, supplier_id: supplierId, lines });
      setRequests((prev) => [created, ...prev]);
      return created;
    },
    [filialId, setRequests]
  );

  const advanceStatus = useCallback(
    async (id: string, status: string, quotes?: { line_id: string; unit_cost: number }[], warehouseId?: string) => {
      const updated = await updatePurchaseRequestStatus(id, status, quotes, warehouseId);
      setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      return updated;
    },
    [setRequests]
  );

  return { requests, loading, error, addRequest, advanceStatus, refresh };
}