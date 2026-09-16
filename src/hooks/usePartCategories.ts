"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createPartCategory,
  listPartCategories,
  renamePartCategory,
  setPartCategoryActive,
} from "@/lib/api/parts";
import type { PartCategory } from "@/types/parts";

/** The holding-wide part-category catalog (Ajustes → Categorías de
 * Repuestos). Pass includeInactive=true only for the management screen. */
export function usePartCategories(filialId: string | null, includeInactive = false) {
  const [categories, setCategories] = useState<PartCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!filialId) {
      setCategories([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await listPartCategories(filialId, includeInactive);
    setCategories(data);
    setLoading(false);
  }, [filialId, includeInactive]);

  useEffect(() => {
    load();
  }, [load]);

  const addCategory = useCallback(
    async (name: string) => {
      if (!filialId) throw new Error("Filial requerida.");
      const created = await createPartCategory(filialId, name);
      await load();
      return created;
    },
    [filialId, load]
  );

  const editCategory = useCallback(
    async (categoryId: string, name: string) => {
      if (!filialId) throw new Error("Filial requerida.");
      const updated = await renamePartCategory(filialId, categoryId, name);
      await load();
      return updated;
    },
    [filialId, load]
  );

  const toggleCategoryActive = useCallback(
    async (categoryId: string, isActive: boolean) => {
      if (!filialId) throw new Error("Filial requerida.");
      await setPartCategoryActive(filialId, categoryId, isActive);
      await load();
    },
    [filialId, load]
  );

  return { categories, loading, refresh: load, addCategory, editCategory, toggleCategoryActive };
}
