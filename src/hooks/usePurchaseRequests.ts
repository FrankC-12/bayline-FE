"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listPurchaseRequests,
  createPurchaseRequest,
  updatePurchaseRequestStatus,
} from "@/lib/api/administracion";
import type { PurchaseRequest } from "@/types/administracion";

export function usePurchaseRequests(filialId: string | null, search?: string) {
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!filialId) {
      setRequests([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await listPurchaseRequests(filialId, search);
    setRequests(data);
    setLoading(false);
  }, [filialId, search]);

  useEffect(() => {
    load();
  }, [load]);

  const addRequest = useCallback(
    async (supplierId: string, lines: { part_id: string; quantity: number }[]) => {
      if (!filialId) return;
      const created = await createPurchaseRequest({ filial_id: filialId, supplier_id: supplierId, lines });
      setRequests((prev) => [created, ...prev]);
      return created;
    },
    [filialId]
  );

  const advanceStatus = useCallback(
    async (id: string, status: string, quotes?: { line_id: string; unit_cost: number }[], warehouseId?: string) => {
      const updated = await updatePurchaseRequestStatus(id, status, quotes, warehouseId);
      setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      return updated;
    },
    []
  );

  return { requests, loading, addRequest, advanceStatus, refresh: load };
}