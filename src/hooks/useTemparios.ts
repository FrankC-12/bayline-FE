"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listTemparios,
  createTempario,
  updateTempario,
  type CreateTemparioInput,
  type UpdateTemparioInput,
} from "@/lib/api/temparios";
import type { Tempario } from "@/types/tempario";

export function useTemparios(filialId: string | null, search?: string) {
  const [temparios, setTemparios] = useState<Tempario[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!filialId) {
      setTemparios([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await listTemparios(filialId, search);
    setTemparios(data);
    setLoading(false);
  }, [filialId, search]);

  useEffect(() => {
    load();
  }, [load]);

  const addTempario = useCallback(async (input: CreateTemparioInput) => {
    const created = await createTempario(input);
    setTemparios((prev) => [...prev, created]);
    return created;
  }, []);

  const editTempario = useCallback(async (id: string, input: UpdateTemparioInput) => {
    const updated = await updateTempario(id, input);
    setTemparios((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    return updated;
  }, []);

  return { temparios, loading, addTempario, editTempario, refresh: load };
}