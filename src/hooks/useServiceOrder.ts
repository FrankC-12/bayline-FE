"use client";

import { useCallback, useEffect, useState } from "react";
import {
  cancelServiceOrder,
  forceCompleteServiceOrder,
  getServiceOrder,
  reopenServiceOrder,
  updateServiceOrder,
  type UpdateServiceOrderInput,
} from "@/lib/api/serviceOrders";
import { useAutoRefresh } from "./useAutoRefresh";
import type { ServiceOrder } from "@/types/serviceOrder";

export function useServiceOrder(id: string) {
  const [order, setOrder] = useState<ServiceOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (background = false) => {
    if (!background) { setLoading(true); setError(null); }
    try {
      const data = await getServiceOrder(id);
      setOrder(data);
      setError(null);
    } catch (err) {
      if (!background) {
        setOrder(null);
        setError(err instanceof Error ? err.message : "No se pudo cargar la orden.");
      }
    } finally {
      if (!background) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const refreshQuietly = useCallback(() => load(true), [load]);
  useAutoRefresh(refreshQuietly);

  const update = useCallback(
    async (input: UpdateServiceOrderInput) => {
      const updated = await updateServiceOrder(id, input);
      setOrder(updated);
      return updated;
    },
    [id]
  );

  const cancel = useCallback(
    async (reason: string) => {
      const updated = await cancelServiceOrder(id, reason);
      setOrder(updated);
      return updated;
    },
    [id]
  );

  const reopen = useCallback(async () => {
    const updated = await reopenServiceOrder(id);
    setOrder(updated);
    return updated;
  }, [id]);

  const forceComplete = useCallback(async () => {
    const updated = await forceCompleteServiceOrder(id);
    setOrder(updated);
    return updated;
  }, [id]);

  return { order, loading, error, update, cancel, reopen, forceComplete, refresh: load };
}