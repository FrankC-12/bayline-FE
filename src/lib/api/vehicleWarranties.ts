import { apiFetch } from "./client";
import type { VehicleWarranty } from "@/types/vehicleWarranty";

export interface CreateVehicleWarrantyInput {
  filial_id: string;
  vin: string;
  brand: string;
  model?: string | null;
  starts_at: string;
  duration_months?: number | null;
  duration_km?: number | null;
  note?: string | null;
}

export async function listVehicleWarranties(filialId: string, search?: string): Promise<VehicleWarranty[]> {
  const query = new URLSearchParams({ filial_id: filialId });
  if (search) query.set("search", search);
  return apiFetch<VehicleWarranty[]>(`/vehicle-warranties?${query.toString()}`);
}

export async function getVehicleWarrantyByVin(filialId: string, vin: string): Promise<VehicleWarranty> {
  return apiFetch<VehicleWarranty>(`/vehicle-warranties/by-vin/${vin}?filial_id=${filialId}`);
}

export async function createVehicleWarranty(input: CreateVehicleWarrantyInput): Promise<VehicleWarranty> {
  return apiFetch<VehicleWarranty>("/vehicle-warranties", { method: "POST", body: JSON.stringify(input) });
}

export interface BulkVehicleWarrantyItem {
  vin: string;
  brand: string;
  model?: string | null;
  starts_at: string;
  duration_months?: number | null;
  duration_km?: number | null;
  note?: string | null;
}

export interface BulkVehicleWarrantyResult {
  created: VehicleWarranty[];
  skipped: string[];
}

export async function bulkCreateVehicleWarranties(
  filialId: string,
  items: BulkVehicleWarrantyItem[]
): Promise<BulkVehicleWarrantyResult> {
  return apiFetch<BulkVehicleWarrantyResult>("/vehicle-warranties/bulk", {
    method: "POST",
    body: JSON.stringify({ filial_id: filialId, items }),
  });
}
