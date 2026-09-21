"use client";

import { useCallback } from "react";
import {
  createPartMeasure,
  listPartMeasures,
  renamePartMeasure,
  setPartMeasureActive,
} from "@/lib/api/parts";
import type { PartMeasure } from "@/types/parts";
import { useListLoader } from "./useListLoader";

/** The holding-wide part-measure catalog (Ajustes → Medidas de Repuestos).
 * Pass includeInactive=true only for the management screen. */
export function usePartMeasures(filialId: string | null, includeInactive = false) {
  const {
    data: measures,
    loading,
    error,
    refresh: load,
  } = useListLoader<PartMeasure>(
    () => (filialId ? listPartMeasures(filialId, includeInactive) : Promise.resolve([])),
    [filialId, includeInactive]
  );

  const addMeasure = useCallback(
    async (name: string) => {
      if (!filialId) throw new Error("Filial requerida.");
      const created = await createPartMeasure(filialId, name);
      await load();
      return created;
    },
    [filialId, load]
  );

  const editMeasure = useCallback(
    async (measureId: string, name: string) => {
      if (!filialId) throw new Error("Filial requerida.");
      const updated = await renamePartMeasure(filialId, measureId, name);
      await load();
      return updated;
    },
    [filialId, load]
  );

  const toggleMeasureActive = useCallback(
    async (measureId: string, isActive: boolean) => {
      if (!filialId) throw new Error("Filial requerida.");
      await setPartMeasureActive(filialId, measureId, isActive);
      await load();
    },
    [filialId, load]
  );

  return { measures, loading, error, refresh: load, addMeasure, editMeasure, toggleMeasureActive };
}
