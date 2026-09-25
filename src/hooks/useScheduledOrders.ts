"use client";

import { useCallback } from "react";
import {
  listServiceOrders,
  createServiceOrder,
  updateServiceOrder,
  type CreateServiceOrderInput,
  type UpdateServiceOrderInput,
} from "@/lib/api/serviceOrders";
import type { ServiceOrder } from "@/types/serviceOrder";
import { useListLoader } from "./useListLoader";

/** dateStr: "YYYY-MM-DD" */
export function useScheduledOrders(filialId: string | null, dateStr: string) {
  const {
    data: orders,
    setData: setOrders,
    loading,
    error,
    refresh,
  } = useListLoader<ServiceOrder>(
    async () => {
      if (!filialId) return [];
      // "active" — not "all" — so a cancelada/orden_cerrada order scheduled
      // for today doesn't show up here when it's already gone from the
      // Kanban board (which never shows those two statuses at all).
      const data = await listServiceOrders(filialId, "active", dateStr);
      return data.filter((o) => o.scheduled_at);
    },
    [filialId, dateStr]
  );

  const addOrder = useCallback(async (input: CreateServiceOrderInput) => {
    const created = await createServiceOrder(input);
    setOrders((prev) => [...prev, created]);
    return created;
  }, [setOrders]);

  const rescheduleOrder = useCallback(async (id: string, input: UpdateServiceOrderInput) => {
    const updated = await updateServiceOrder(id, input);
    setOrders((prev) => {
      // If it moved outside the currently-loaded day, drop it from this view.
      if (updated.scheduled_at && !updated.scheduled_at.startsWith(dateStr)) {
        return prev.filter((o) => o.id !== updated.id);
      }
      return prev.map((o) => (o.id === updated.id ? updated : o));
    });
    return updated;
  }, [dateStr, setOrders]);

  return { orders, loading, error, addOrder, rescheduleOrder, refresh };
}