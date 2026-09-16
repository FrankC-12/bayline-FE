"use client";

import { useCallback, useEffect, useState } from "react";
import { acknowledgeServiceOrderRequest, listServiceOrderRequests } from "@/lib/api/warehouse";
import type { ServiceOrderPartRequest } from "@/types/warehouse";

const POLL_INTERVAL_MS = 30000;

export function useServiceOrderPartRequests(filialId: string | null) {
  const [requests, setRequests] = useState<ServiceOrderPartRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!filialId) {
      setRequests([]);
      setLoading(false);
      return;
    }
    const data = await listServiceOrderRequests(filialId);
    setRequests(data);
    setLoading(false);
  }, [filialId]);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [load]);

  const acknowledge = useCallback(
    async (transferId: string) => {
      if (!filialId) return;
      setRequests((prev) => prev.map((r) => (r.id === transferId ? { ...r, warehouse_seen: true } : r)));
      await acknowledgeServiceOrderRequest(filialId, transferId);
    },
    [filialId]
  );

  const unseenCount = requests.filter((r) => !r.warehouse_seen).length;

  return { requests, loading, unseenCount, acknowledge, refresh: load };
}
