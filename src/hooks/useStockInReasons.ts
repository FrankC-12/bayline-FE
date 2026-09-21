"use client";

import { useCallback } from "react";
import {
  createStockInReason,
  listStockInReasons,
  renameStockInReason,
  setStockInReasonActive,
} from "@/lib/api/warehouse";
import type { StockInReason } from "@/types/warehouse";
import { useListLoader } from "./useListLoader";

/** The holding-wide "Motivos de Entrada" catalog (Ajustes → Motivos de
 * Entrada). Pass includeInactive=true only for the management screen. */
export function useStockInReasons(filialId: string | null, includeInactive = false) {
  const {
    data: reasons,
    loading,
    error,
    refresh,
  } = useListLoader<StockInReason>(
    () => (filialId ? listStockInReasons(filialId, includeInactive) : Promise.resolve([])),
    [filialId, includeInactive]
  );

  const addReason = useCallback(
    async (name: string) => {
      if (!filialId) throw new Error("Filial requerida.");
      const created = await createStockInReason(filialId, name);
      await refresh();
      return created;
    },
    [filialId, refresh]
  );

  const editReason = useCallback(
    async (reasonId: string, name: string) => {
      if (!filialId) throw new Error("Filial requerida.");
      const updated = await renameStockInReason(filialId, reasonId, name);
      await refresh();
      return updated;
    },
    [filialId, refresh]
  );

  const toggleReasonActive = useCallback(
    async (reasonId: string, isActive: boolean) => {
      if (!filialId) throw new Error("Filial requerida.");
      await setStockInReasonActive(filialId, reasonId, isActive);
      await refresh();
    },
    [filialId, refresh]
  );

  return { reasons, loading, error, refresh, addReason, editReason, toggleReasonActive };
}
