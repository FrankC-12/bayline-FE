"use client";

import { useCallback } from "react";
import {
  createPartCategory,
  listPartCategories,
  renamePartCategory,
  setPartCategoryActive,
} from "@/lib/api/parts";
import type { PartCategory } from "@/types/parts";
import { useListLoader } from "./useListLoader";

/** The holding-wide part-category catalog (Ajustes → Categorías de
 * Repuestos). Pass includeInactive=true only for the management screen. */
export function usePartCategories(filialId: string | null, includeInactive = false) {
  const {
    data: categories,
    loading,
    error,
    refresh: load,
  } = useListLoader<PartCategory>(
    () => (filialId ? listPartCategories(filialId, includeInactive) : Promise.resolve([])),
    [filialId, includeInactive]
  );

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

  return { categories, loading, error, refresh: load, addCategory, editCategory, toggleCategoryActive };
}
