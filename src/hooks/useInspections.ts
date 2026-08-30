"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listInspections,
  createInspection,
  updateInspection,
  deleteInspection,
  type CreateInspectionInput,
  type UpdateInspectionInput,
} from "@/lib/api/inspections";
import type { Inspection } from "@/types/inspection";

export function useInspections(filialId: string | null, unlinkedOnly = false) {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!filialId) {
      setInspections([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await listInspections(filialId, unlinkedOnly);
    setInspections(data);
    setLoading(false);
  }, [filialId, unlinkedOnly]);

  useEffect(() => {
    load();
  }, [load]);

  const addInspection = useCallback(async (input: CreateInspectionInput) => {
    const created = await createInspection(input);
    setInspections((prev) => [created, ...prev]);
    return created;
  }, []);

  const editInspection = useCallback(async (id: string, input: UpdateInspectionInput) => {
    const updated = await updateInspection(id, input);
    setInspections((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    return updated;
  }, []);

  const removeInspection = useCallback(async (id: string) => {
    await deleteInspection(id);
    setInspections((prev) => prev.filter((i) => i.id !== id));
  }, []);

  return { inspections, loading, addInspection, editInspection, removeInspection, refresh: load };
}