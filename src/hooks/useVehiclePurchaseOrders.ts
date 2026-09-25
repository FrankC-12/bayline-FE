"use client";

import { useCallback } from "react";
import {
  listVehiclePurchaseOrders,
  createVehiclePurchaseOrder,
  type CreateVehiclePurchaseOrderInput,
} from "@/lib/api/compras";
import type { VehiclePurchaseOrder } from "@/types/compras";
import { useListLoader } from "./useListLoader";

export function useVehiclePurchaseOrders(filialId: string | null) {
  const {
    data: orders,
    setData: setOrders,
    loading,
    error,
    refresh,
  } = useListLoader<VehiclePurchaseOrder>(
    () => (filialId ? listVehiclePurchaseOrders(filialId) : Promise.resolve([])),
    [filialId]
  );

  const addOrder = useCallback(
    async (input: CreateVehiclePurchaseOrderInput) => {
      const created = await createVehiclePurchaseOrder(input);
      setOrders((prev) => [created, ...prev]);
      return created;
    },
    [setOrders]
  );

  return { orders, loading, error, addOrder, refresh };
}
