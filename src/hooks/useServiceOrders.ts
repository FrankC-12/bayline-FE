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

export function useServiceOrders(filialId: string | null, view: "active" | "history" | "all" = "active") {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!filialId) {
      setOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await listServiceOrders(filialId, view);
    setOrders(data);
    setLoading(false);
  }, [filialId, view]);

  useEffect(() => {
    load();
  }, [load]);

  const addOrder = useCallback(async (input: CreateServiceOrderInput) => {
    const created = await createServiceOrder(input);
    setOrders((prev) => [created, ...prev]);
    return created;
  }, []);

  const editOrder = useCallback(async (id: string, input: UpdateServiceOrderInput) => {
    const updated = await updateServiceOrder(id, input);
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    return updated;
  }, []);

  return { orders, loading, addOrder, editOrder, refresh: load };
}