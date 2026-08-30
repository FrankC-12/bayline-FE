"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listFiliales,
  createFilial,
  updateFilial,
  setFilialActive,
  type CreateFilialInput,
  type UpdateFilialInput,
} from "@/lib/api/filiales";
import type { Filial } from "@/types/filial";

export function useFiliales(holdingId?: string | null) {
  const [filiales, setFiliales] = useState<Filial[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await listFiliales(holdingId ?? undefined);
    setFiliales(data);
    setLoading(false);
  }, [holdingId]);

  useEffect(() => {
    load();
  }, [load]);

  const addFilial = useCallback(async (input: CreateFilialInput) => {
    const created = await createFilial(input);
    setFiliales((prev) => [created, ...prev]);
    return created;
  }, []);

  const editFilial = useCallback(async (id: string, input: UpdateFilialInput) => {
    const updated = await updateFilial(id, input);
    setFiliales((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
    return updated;
  }, []);

  const toggleActive = useCallback(async (id: string, isActive: boolean) => {
    const updated = await setFilialActive(id, isActive);
    setFiliales((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
    return updated;
  }, []);

  return { filiales, loading, addFilial, editFilial, toggleActive, refresh: load };
}