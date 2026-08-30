import { apiFetch } from "./client";
import type { DealershipVehicle, VehicleSale } from "@/types/concesionario";

export interface CreateVehicleInput {
  filial_id: string;
  status: string;
  condition: string;
  brand: string;
  model: string;
  year: number;
  color?: string | null;
  fuel_type?: string | null;
  transmission?: string | null;
  vin: string;
  plate?: string | null;
  sku: string;
  price_cash: number;
  price_financed: number;
  cost_price?: number | null;
}

export interface VehicleSaleInput {
  client_name: string;
  client_document?: string | null;
  advisor_user_id?: string | null;
  sale_type: string;
  final_price: number;
}

export interface UpdateVehicleInput {
  status?: string;
  condition?: string;
  brand?: string;
  model?: string;
  year?: number;
  color?: string | null;
  fuel_type?: string | null;
  transmission?: string | null;
  plate?: string | null;
  price_cash?: number;
  price_financed?: number;
  cost_price?: number | null;
  sale?: VehicleSaleInput;
}

export async function listVehicles(filialId: string, search?: string): Promise<DealershipVehicle[]> {
  const query = new URLSearchParams({ filial_id: filialId });
  if (search) query.set("search", search);
  return apiFetch<DealershipVehicle[]>(`/dealership-vehicles?${query.toString()}`);
}

export async function createVehicle(input: CreateVehicleInput): Promise<DealershipVehicle> {
  return apiFetch<DealershipVehicle>("/dealership-vehicles", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateVehicle(id: string, input: UpdateVehicleInput): Promise<DealershipVehicle> {
  return apiFetch<DealershipVehicle>(`/dealership-vehicles/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteVehicle(id: string): Promise<void> {
  await apiFetch(`/dealership-vehicles/${id}`, { method: "DELETE" });
}

export async function listVehicleSales(filialId: string): Promise<VehicleSale[]> {
  return apiFetch<VehicleSale[]>(`/vehicle-sales?filial_id=${filialId}`);
}