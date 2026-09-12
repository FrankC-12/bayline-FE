"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listMaintenancePlans,
  createMaintenancePlan,
  updateMaintenancePlan,
  type CreateMaintenancePlanInput,
  type UpdateMaintenancePlanInput,
} from "@/lib/api/maintenancePlans";
import type { MaintenancePlan } from "@/types/maintenancePlan";

export function useMaintenancePlans(filialId: string | null, search?: string) {
  const [plans, setPlans] = useState<MaintenancePlan[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!filialId) {
      setPlans([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await listMaintenancePlans(filialId, search);
    setPlans(data);
    setLoading(false);
  }, [filialId, search]);

  useEffect(() => {
    load();
  }, [load]);

  const addPlan = useCallback(async (input: CreateMaintenancePlanInput) => {
    const created = await createMaintenancePlan(input);
    setPlans((prev) => [...prev, created]);
    return created;
  }, []);

  const editPlan = useCallback(async (id: string, input: UpdateMaintenancePlanInput) => {
    const updated = await updateMaintenancePlan(id, input);
    setPlans((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    return updated;
  }, []);

  return { plans, loading, addPlan, editPlan, refresh: load };
}
