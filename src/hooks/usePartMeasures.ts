"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createPartMeasure,
  listPartMeasures,
  renamePartMeasure,
  setPartMeasureActive,
} from "@/lib/api/parts";
import type { PartMeasure } from "@/types/parts";

/** The holding-wide part-measure catalog (Ajustes → Medidas de Repuestos).
 * Pass includeInactive=true only for the management screen. */
export function usePartMeasures(filialId: string | null, includeInactive = false) {
  const [measures, setMeasures] = useState<PartMeasure[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!filialId) {
      setMeasures([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await listPartMeasures(filialId, includeInactive);
    setMeasures(data);
    setLoading(false);
  }, [filialId, includeInactive]);

  useEffect(() => {
    load();
  }, [load]);

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

  return { measures, loading, refresh: load, addMeasure, editMeasure, toggleMeasureActive };
}
