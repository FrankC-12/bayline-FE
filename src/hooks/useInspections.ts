"use client";

import { useCallback } from "react";
import {
  listInspections,
  createInspection,
  updateInspection,
  deleteInspection,
  type CreateInspectionInput,
  type UpdateInspectionInput,
} from "@/lib/api/inspections";
import type { Inspection } from "@/types/inspection";
import { useListLoader } from "./useListLoader";

export function useInspections(filialId: string | null, unlinkedOnly = false) {
  const {
    data: inspections,
    setData: setInspections,
    loading,
    error,
    refresh,
  } = useListLoader<Inspection>(
    () => (filialId ? listInspections(filialId, unlinkedOnly) : Promise.resolve([])),
    [filialId, unlinkedOnly]
  );

  const addInspection = useCallback(
    async (input: CreateInspectionInput) => {
      const created = await createInspection(input);
      setInspections((prev) => [created, ...prev]);
      return created;
    },
    [setInspections]
  );

  const editInspection = useCallback(
    async (id: string, input: UpdateInspectionInput) => {
      const updated = await updateInspection(id, input);
      setInspections((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      return updated;
    },
    [setInspections]
  );

  const removeInspection = useCallback(
    async (id: string) => {
      await deleteInspection(id);
      setInspections((prev) => prev.filter((i) => i.id !== id));
    },
    [setInspections]
  );

  return { inspections, loading, error, addInspection, editInspection, removeInspection, refresh };
}
