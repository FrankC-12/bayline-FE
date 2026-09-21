"use client";

import { useCallback } from "react";
import {
  listTransfers,
  createTransfer,
  updateTransferStatus,
  type TransferLineInput,
} from "@/lib/api/warehouse";
import type { Transfer } from "@/types/warehouse";
import { useListLoader } from "./useListLoader";

export function useTransfers(filialId: string | null) {
  const {
    data: transfers,
    setData: setTransfers,
    loading,
    error,
    refresh,
  } = useListLoader<Transfer>(() => (filialId ? listTransfers(filialId) : Promise.resolve([])), [filialId]);

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
    [filialId, setTransfers]
  );

  const setStatus = useCallback(
    async (transferId: string, status: string) => {
      const updated = await updateTransferStatus(transferId, status);
      setTransfers((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      return updated;
    },
    [setTransfers]
  );

  return { transfers, loading, error, addTransfer, setStatus, refresh };
}
