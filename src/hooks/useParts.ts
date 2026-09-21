"use client";

import { useCallback } from "react";
import {
  listParts,
  createPart,
  updatePart,
  setPartActive,
  bulkCreateParts,
  type CreatePartInput,
  type UpdatePartInput,
  type BulkPartItem,
} from "@/lib/api/parts";
import type { Part } from "@/types/parts";
import { useListLoader } from "./useListLoader";

export function useParts(filialId: string | null, search?: string, includeInactive = false) {
  const {
    data: parts,
    loading,
    error,
    refresh,
  } = useListLoader<Part>(
    () => (filialId ? listParts(filialId, search, includeInactive) : Promise.resolve([])),
    [filialId, search, includeInactive]
  );

  const addPart = useCallback(async (input: CreatePartInput) => {
    const created = await createPart(input);
    await refresh();
    return created;
  }, [refresh]);

  const editPart = useCallback(async (id: string, input: UpdatePartInput) => {
    const updated = await updatePart(id, input);
    await refresh();
    return updated;
  }, [refresh]);

  const bulkAddParts = useCallback(
    async (items: BulkPartItem[]) => {
      if (!filialId) throw new Error("No filial selected.");
      const result = await bulkCreateParts(filialId, items);
      await refresh();
      return result;
    },
    [filialId, refresh]
  );

  const toggleActive = useCallback(
    async (id: string, isActive: boolean) => {
      const updated = await setPartActive(id, isActive);
      await refresh();
      return updated;
    },
    [refresh]
  );

  return { parts, loading, error, addPart, editPart, bulkAddParts, toggleActive, refresh };
}
