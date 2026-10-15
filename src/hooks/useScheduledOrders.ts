"use client";

import { useCallback } from "react";
import { listServiceOrders } from "@/lib/api/serviceOrders";
import type { ServiceOrder } from "@/types/serviceOrder";
import { useListLoader } from "./useListLoader";
import { useServiceOrders } from "./useServiceOrders";

/** Calendar day is filtered on the server in Caracas, including historical appointments. */
export function useScheduledOrders(filialId: string | null, dateStr: string) {
  const { orders: activeOrders, editOrder, addOrder: createOrder, refresh: refreshActive } = useServiceOrders(filialId, "active");
  const { data: orders, loading, error, refresh: refreshDay } = useListLoader<ServiceOrder>(
    () => filialId ? listServiceOrders(filialId, "all", dateStr) : Promise.resolve([]),
    [filialId, dateStr], 15000,
  );
  const refresh = useCallback(async () => { await Promise.all([refreshDay(), refreshActive()]); }, [refreshDay, refreshActive]);
  const addOrder = useCallback(async (...args: Parameters<typeof createOrder>) => {
    const created = await createOrder(...args); await refreshDay(); return created;
  }, [createOrder, refreshDay]);
  const rescheduleOrder = useCallback(async (...args: Parameters<typeof editOrder>) => {
    const updated = await editOrder(...args); await refreshDay(); return updated;
  }, [editOrder, refreshDay]);
  return { orders, activeOrders, loading, error, addOrder, rescheduleOrder, refresh };
}
