"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listParts,
  createPart,
  updatePart,
  bulkCreateParts,
  type CreatePartInput,
  type UpdatePartInput,
  type BulkPartItem,
} from "@/lib/api/parts";
import type { Part } from "@/types/parts";

export function useParts(filialId: string | null, search?: string) {
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!filialId) {
      setParts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await listParts(filialId, search);
    setParts(data);
    setLoading(false);
  }, [filialId, search]);

  useEffect(() => {
    load();
  }, [load]);

  const addPart = useCallback(async (input: CreatePartInput) => {
    const created = await createPart(input);
    await load();
    return created;
  }, [load]);

  const editPart = useCallback(async (id: string, input: UpdatePartInput) => {
    const updated = await updatePart(id, input);
    await load();
    return updated;
  }, [load]);

  const bulkAddParts = useCallback(
    async (items: BulkPartItem[]) => {
      if (!filialId) throw new Error("No filial selected.");
      const result = await bulkCreateParts(filialId, items);
      await load();
      return result;
    },
    [filialId, load]
  );

  return { parts, loading, addPart, editPart, bulkAddParts, refresh: load };
}
