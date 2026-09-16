"use client";

import { useCallback, useEffect, useState } from "react";
import { getInventory } from "@/lib/api/warehouse";
import type { InventoryRow } from "@/types/warehouse";

/** How much of one specific part is on the shelf, broken down by warehouse
 * — e.g. for the "disponible en cada almacén" hint when picking a part on a
 * transfer order. Empty/no rows for a warehouse simply means zero stock. */
export function usePartAvailability(filialId: string | null, partId: string | null) {
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!filialId || !partId) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await getInventory(filialId, undefined, undefined, partId);
    setRows(data);
    setLoading(false);
  }, [filialId, partId]);

  useEffect(() => {
    load();
  }, [load]);

  return { rows, loading };
}
