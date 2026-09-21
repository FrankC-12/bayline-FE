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

export function useServiceOrders(filialId: string | null, view: "active" | "history" | "all" = "active") {
  const {
    data: orders,
    setData: setOrders,
    loading,
    error,
    refresh,
  } = useListLoader<ServiceOrder>(
    () => (filialId ? listServiceOrders(filialId, view) : Promise.resolve([])),
    [filialId, view]
  );

  const addOrder = useCallback(
    async (input: CreateServiceOrderInput) => {
      const created = await createServiceOrder(input);
      setOrders((prev) => [created, ...prev]);
      return created;
    },
    [setOrders]
  );

  const editOrder = useCallback(
    async (id: string, input: UpdateServiceOrderInput) => {
      const updated = await updateServiceOrder(id, input);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      return updated;
    },
    [setOrders]
  );

  return { orders, loading, error, addOrder, editOrder, refresh };
}