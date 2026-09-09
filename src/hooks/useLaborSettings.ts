"use client";

import { useCallback, useEffect, useState } from "react";
import { getLaborSettings, updateLaborSettings, type UpdateLaborSettingsInput } from "@/lib/api/temparios";
import type { LaborSettings } from "@/types/tempario";

export function useLaborSettings(filialId: string | null) {
  const [settings, setSettings] = useState<LaborSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!filialId) {
      setSettings(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getLaborSettings(filialId);
      setSettings(data);
    } catch (err) {
      setSettings(null);
      setError(err instanceof Error ? err.message : "No se pudo cargar Ajustes.");
    } finally {
      setLoading(false);
    }
  }, [filialId]);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(
    async (input: UpdateLaborSettingsInput) => {
      if (!filialId) return;
      const updated = await updateLaborSettings(filialId, input);
      setSettings(updated);
      return updated;
    },
    [filialId]
  );

  return { settings, loading, error, save, refresh: load };
}