"use client";

import { useCallback, useEffect, useState } from "react";
import { getLaborSettings, updateLaborSettings, type UpdateLaborSettingsInput } from "@/lib/api/temparios";
import type { LaborSettings } from "@/types/tempario";

export function useLaborSettings(filialId: string | null) {
  const [settings, setSettings] = useState<LaborSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!filialId) {
      setSettings(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await getLaborSettings(filialId);
    setSettings(data);
    setLoading(false);
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

  return { settings, loading, save, refresh: load };
}