"use client";

import { useCallback, useEffect, useState } from "react";
import { getInspectionForOrder, updateInspection } from "@/lib/api/inspections";
import type { Inspection } from "@/types/inspection";

export function useInspectionForOrder(orderId: string | null) {
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!orderId) {
      setInspection(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await getInspectionForOrder(orderId);
    setInspection(data);
    setLoading(false);
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  const link = useCallback(
    async (inspectionId: string) => {
      if (!orderId) return;
      const updated = await updateInspection(inspectionId, { service_order_id: orderId });
      setInspection(updated);
      return updated;
    },
    [orderId]
  );

  return { inspection, loading, link, refresh: load };
}