"use client";

import { useCallback, useEffect, useState } from "react";
import { listPartSaleRequests } from "@/lib/api/warehouse";
import type { PartSaleRequest } from "@/types/warehouse";

const POLL_INTERVAL_MS = 30000;

/** Counter parts sales (Venta de Repuestos), surfaced the same way as
 * useServiceOrderPartRequests — same idea, different destination (mostrador
 * vs. taller). No acknowledge/unseen-badge concept here (that's specific to
 * ODT requests today); this is a plain informational feed. */
export function usePartSaleRequests(filialId: string | null) {
  const [requests, setRequests] = useState<PartSaleRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!filialId) {
      setRequests([]);
      setLoading(false);
      return;
    }
    const data = await listPartSaleRequests(filialId);
    setRequests(data);
    setLoading(false);
  }, [filialId]);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [load]);

  return { requests, loading, refresh: load };
}
