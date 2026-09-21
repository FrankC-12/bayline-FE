"use client";

import { useCallback } from "react";
import {
  listMaintenancePlans,
  createMaintenancePlan,
  updateMaintenancePlan,
  type CreateMaintenancePlanInput,
  type UpdateMaintenancePlanInput,
} from "@/lib/api/maintenancePlans";
import type { MaintenancePlan } from "@/types/maintenancePlan";
import { useListLoader } from "./useListLoader";

export function useMaintenancePlans(filialId: string | null, search?: string) {
  const {
    data: plans,
    setData: setPlans,
    loading,
    error,
    refresh,
  } = useListLoader<MaintenancePlan>(
    () => (filialId ? listMaintenancePlans(filialId, search) : Promise.resolve([])),
    [filialId, search]
  );

  const addPlan = useCallback(
    async (input: CreateMaintenancePlanInput) => {
      const created = await createMaintenancePlan(input);
      setPlans((prev) => [...prev, created]);
      return created;
    },
    [setPlans]
  );

  const editPlan = useCallback(
    async (id: string, input: UpdateMaintenancePlanInput) => {
      const updated = await updateMaintenancePlan(id, input);
      setPlans((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      return updated;
    },
    [setPlans]
  );

  return { plans, loading, error, addPlan, editPlan, refresh };
}
