"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listTransfers,
  createTransfer,
  updateTransferStatus,
  type TransferLineInput,
} from "@/lib/api/warehouse";
import type { Transfer } from "@/types/warehouse";

export function useTransfers(filialId: string | null) {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!filialId) {
      setTransfers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await listTransfers(filialId);
    setTransfers(data);
    setLoading(false);
  }, [filialId]);

  useEffect(() => {
    load();
  }, [load]);

  const addTransfer = useCallback(
    async (originWarehouseId: string, destinationWarehouseId: string, lines: TransferLineInput[], note?: string) => {
      if (!filialId) return;
      const created = await createTransfer({
        filial_id: filialId,
        origin_warehouse_id: originWarehouseId,
        destination_warehouse_id: destinationWarehouseId,
        note,
        lines,
      });
      setTransfers((prev) => [created, ...prev]);
      return created;
    },
    [filialId]
  );

  const setStatus = useCallback(async (transferId: string, status: string) => {
    const updated = await updateTransferStatus(transferId, status);
    setTransfers((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    return updated;
  }, []);

  return { transfers, loading, addTransfer, setStatus, refresh: load };
}