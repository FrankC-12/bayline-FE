"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listServiceOrders,
  createServiceOrder,
  updateServiceOrder,
  type CreateServiceOrderInput,
  type UpdateServiceOrderInput,
} from "@/lib/api/serviceOrders";
import type { ServiceOrder } from "@/types/serviceOrder";

/** dateStr: "YYYY-MM-DD" */
export function useScheduledOrders(filialId: string | null, dateStr: string) {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!filialId) {
      setOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await listServiceOrders(filialId, "all", dateStr);
    setOrders(data.filter((o) => o.scheduled_at));
    setLoading(false);
  }, [filialId, dateStr]);

  useEffect(() => {
    load();
  }, [load]);

  const addOrder = useCallback(async (input: CreateServiceOrderInput) => {
    const created = await createServiceOrder(input);
    setOrders((prev) => [...prev, created]);
    return created;
  }, []);

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
  }, [dateStr]);

  return { orders, loading, addOrder, rescheduleOrder, refresh: load };
}