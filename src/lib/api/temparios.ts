import { apiFetch } from "./client";
import type { CompatibleVehicle, LaborSettings, Tempario } from "@/types/tempario";

export interface TemparioPartInput {
  part_id?: string | null;
  name: string;
  quantity: number;
  unit_cost: number;
}

export interface CreateTemparioInput {
  filial_id: string;
  category: string;
  sequence_number?: number | null;
  name: string;
  estimated_hours: number;
  year_from?: number | null;
  year_to?: number | null;
  compatible_vehicles?: CompatibleVehicle[];
  tools?: string[];
  requires_parts?: boolean;
  parts?: TemparioPartInput[];
}

export type UpdateTemparioInput = Partial<Omit<CreateTemparioInput, "filial_id" | "category">>;

export async function listTemparios(filialId: string, search?: string): Promise<Tempario[]> {
  const query = new URLSearchParams({ filial_id: filialId });
  if (search) query.set("search", search);
  return apiFetch<Tempario[]>(`/temparios?${query.toString()}`);
}

export async function createTempario(input: CreateTemparioInput): Promise<Tempario> {
  return apiFetch<Tempario>("/temparios", { method: "POST", body: JSON.stringify(input) });
}

export async function updateTempario(id: string, input: UpdateTemparioInput): Promise<Tempario> {
  return apiFetch<Tempario>(`/temparios/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export async function getLaborSettings(filialId: string): Promise<LaborSettings> {
  return apiFetch<LaborSettings>(`/labor-settings?filial_id=${filialId}`);
}

export interface UpdateLaborSettingsInput {
  hourly_rate: number;
  commission_percentage: number;
  igtf_percentage: number;
  iva_percentage: number;
  bcv_rate: number;
}

export async function updateLaborSettings(
  filialId: string,
  input: UpdateLaborSettingsInput
): Promise<LaborSettings> {
  return apiFetch<LaborSettings>(`/labor-settings?filial_id=${filialId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}