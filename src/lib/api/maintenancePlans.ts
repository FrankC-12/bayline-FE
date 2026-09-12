import { apiFetch } from "./client";
import type { MaintenancePlan } from "@/types/maintenancePlan";

export interface MaintenancePlanEntryInput {
  tempario_id: string;
  interval_km?: number | null;
  interval_months?: number | null;
}

export interface CreateMaintenancePlanInput {
  filial_id: string;
  brand: string;
  name: string;
  entries: MaintenancePlanEntryInput[];
}

export type UpdateMaintenancePlanInput = Partial<Omit<CreateMaintenancePlanInput, "filial_id">>;

export async function listMaintenancePlans(
  filialId: string,
  search?: string
): Promise<MaintenancePlan[]> {
  const query = new URLSearchParams({ filial_id: filialId });
  if (search) query.set("search", search);
  return apiFetch<MaintenancePlan[]>(`/maintenance-plans?${query.toString()}`);
}

export async function createMaintenancePlan(
  input: CreateMaintenancePlanInput
): Promise<MaintenancePlan> {
  return apiFetch<MaintenancePlan>("/maintenance-plans", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateMaintenancePlan(
  id: string,
  input: UpdateMaintenancePlanInput
): Promise<MaintenancePlan> {
  return apiFetch<MaintenancePlan>(`/maintenance-plans/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
