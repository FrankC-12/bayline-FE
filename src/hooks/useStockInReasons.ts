"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createStockInReason,
  listStockInReasons,
  renameStockInReason,
  setStockInReasonActive,
} from "@/lib/api/warehouse";
import type { StockInReason } from "@/types/warehouse";

/** The holding-wide "Motivos de Entrada" catalog (Ajustes → Motivos de
 * Entrada). Pass includeInactive=true only for the management screen. */
export function useStockInReasons(filialId: string | null, includeInactive = false) {
  const [reasons, setReasons] = useState<StockInReason[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!filialId) {
      setReasons([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await listStockInReasons(filialId, includeInactive);
    setReasons(data);
    setLoading(false);
  }, [filialId, includeInactive]);

  useEffect(() => {
    load();
  }, [load]);

  const addReason = useCallback(
    async (name: string) => {
      if (!filialId) throw new Error("Filial requerida.");
      const created = await createStockInReason(filialId, name);
      await load();
      return created;
    },
    [filialId, load]
  );

  const editReason = useCallback(
    async (reasonId: string, name: string) => {
      if (!filialId) throw new Error("Filial requerida.");
      const updated = await renameStockInReason(filialId, reasonId, name);
      await load();
      return updated;
    },
    [filialId, load]
  );

  const toggleReasonActive = useCallback(
    async (reasonId: string, isActive: boolean) => {
      if (!filialId) throw new Error("Filial requerida.");
      await setStockInReasonActive(filialId, reasonId, isActive);
      await load();
    },
    [filialId, load]
  );

  return { reasons, loading, refresh: load, addReason, editReason, toggleReasonActive };
}
