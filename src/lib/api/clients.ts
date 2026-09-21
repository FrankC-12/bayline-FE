import { apiFetch } from "./client";
import type { Client, VehicleMileageHistoryEntry } from "@/types/client";
import type { VehiclePlanStatus } from "@/types/maintenancePlan";

export interface VehicleInput {
  id?: string;
  brand: string;
  model: string;
  year?: number | null;
  vin?: string | null;
  mileage?: number | null;
  purchase_date?: string | null;
  body_type?: string | null;
  plate?: string | null;
  color?: string | null;
  upholstery?: string | null;
  fuel_type?: string | null;
  transmission?: string | null;
}

export interface CreateClientInput {
  filial_id: string;
  full_name: string;
  client_type: string;
  document_type: string;
  document_number: string;
  email?: string | null;
  phone_primary: string;
  phone_secondary?: string | null;
  contact_preference?: string | null;
  address: string;
  address_type?: string | null;
  is_holding_billing?: boolean;
  vehicles?: VehicleInput[];
}

export type UpdateClientInput = Partial<Omit<CreateClientInput, "filial_id">>;

export async function listClients(filialId: string, search?: string): Promise<Client[]> {
  const query = new URLSearchParams({ filial_id: filialId });
  if (search) query.set("search", search);
  return apiFetch<Client[]>(`/clients?${query.toString()}`);
}

export async function getClient(id: string): Promise<Client> {
  return apiFetch<Client>(`/clients/${id}`);
}

export async function createClient(input: CreateClientInput): Promise<Client> {
  return apiFetch<Client>("/clients", { method: "POST", body: JSON.stringify(input) });
}

export async function updateClient(id: string, input: UpdateClientInput): Promise<Client> {
  return apiFetch<Client>(`/clients/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export async function deleteClient(id: string): Promise<void> {
  return apiFetch<void>(`/clients/${id}`, { method: "DELETE" });
}

export async function getVehiclePlanStatus(vehicleId: string): Promise<VehiclePlanStatus> {
  return apiFetch<VehiclePlanStatus>(`/clients/vehicles/${vehicleId}/maintenance-plan-status`);
}

export async function assignVehicleMaintenancePlan(
  vehicleId: string,
  planId: string | null
): Promise<VehiclePlanStatus> {
  return apiFetch<VehiclePlanStatus>(`/clients/vehicles/${vehicleId}/maintenance-plan`, {
    method: "PATCH",
    body: JSON.stringify({ plan_id: planId }),
  });
}

export async function getVehicleMileageHistory(vehicleId: string): Promise<VehicleMileageHistoryEntry[]> {
  return apiFetch<VehicleMileageHistoryEntry[]>(`/clients/vehicles/${vehicleId}/mileage-history`);
}