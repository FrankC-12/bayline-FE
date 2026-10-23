"use client";
import { useCallback } from "react";
import { getInspectionForOrder, updateInspection } from "@/lib/api/inspections";
import { useListLoader } from "./useListLoader";
import type { Inspection } from "@/types/inspection";
export function useInspectionForOrder(orderId: string | null) {
  const { data, loading, error, refresh, setData } = useListLoader<Inspection>(
    async () => {
      if (!orderId) return [];
      const value = await getInspectionForOrder(orderId);
      return value ? [value] : [];
    },
    [orderId],
    orderId ? 15000 : 0,
  );
  const link = useCallback(
    async (inspectionId: string) => {
      if (!orderId) return;
      const updated = await updateInspection(inspectionId, {
        service_order_id: orderId,
      });
      setData([updated]);
      return updated;
    },
    [orderId, setData],
  );
  return { inspection: data[0] ?? null, loading, error, link, refresh };
}
