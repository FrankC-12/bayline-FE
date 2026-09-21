"use client";

import { useCallback } from "react";
import {
  listTemparios,
  createTempario,
  updateTempario,
  type CreateTemparioInput,
  type UpdateTemparioInput,
} from "@/lib/api/temparios";
import type { Tempario } from "@/types/tempario";
import { useListLoader } from "./useListLoader";

export function useTemparios(filialId: string | null, search?: string) {
  const {
    data: temparios,
    setData: setTemparios,
    loading,
    error,
    refresh,
  } = useListLoader<Tempario>(() => (filialId ? listTemparios(filialId, search) : Promise.resolve([])), [filialId, search]);

  const addTempario = useCallback(
    async (input: CreateTemparioInput) => {
      const created = await createTempario(input);
      setTemparios((prev) => [...prev, created]);
      return created;
    },
    [setTemparios]
  );

  const editTempario = useCallback(
    async (id: string, input: UpdateTemparioInput) => {
      const updated = await updateTempario(id, input);
      setTemparios((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      return updated;
    },
    [setTemparios]
  );

  return { temparios, loading, error, addTempario, editTempario, refresh };
}
