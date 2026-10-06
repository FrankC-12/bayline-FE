"use client";

import { useCallback } from "react";
import {
  listServiceOrderTypes,
  createServiceOrderType,
  updateServiceOrderType,
  type CreateServiceOrderTypeInput,
  type UpdateServiceOrderTypeInput,
} from "@/lib/api/serviceOrderTypes";
import type { ServiceOrderTypeCatalog } from "@/types/serviceOrderType";
import { useListLoader } from "./useListLoader";

export function useServiceOrderTypes(filialId: string | null) {
  const {
    data: orderTypes,
    setData: setOrderTypes,
    loading,
    error,
    refresh,
  } = useListLoader<ServiceOrderTypeCatalog>(
    () => (filialId ? listServiceOrderTypes(filialId) : Promise.resolve([])),
    [filialId]
  );

  const addOrderType = useCallback(
    async (input: CreateServiceOrderTypeInput) => {
      const created = await createServiceOrderType(input);
      setOrderTypes((prev) => [...prev, created]);
      return created;
    },
    [setOrderTypes]
  );

  const editOrderType = useCallback(
    async (id: string, input: UpdateServiceOrderTypeInput) => {
      const updated = await updateServiceOrderType(id, input);
      setOrderTypes((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      return updated;
    },
    [setOrderTypes]
  );

  return { orderTypes, loading, error, addOrderType, editOrderType, refresh };
}
