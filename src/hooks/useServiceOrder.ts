"use client";

import { useCallback, useEffect, useState } from "react";
import { getServiceOrder, updateServiceOrder, type UpdateServiceOrderInput } from "@/lib/api/serviceOrders";
import type { ServiceOrder } from "@/types/serviceOrder";

export function useServiceOrder(id: string) {
  const [order, setOrder] = useState<ServiceOrder | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getServiceOrder(id);
    setOrder(data);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const update = useCallback(
    async (input: UpdateServiceOrderInput) => {
      const updated = await updateServiceOrder(id, input);
      setOrder(updated);
      return updated;
    },
    [id]
  );

  return { order, loading, update, refresh: load };
}