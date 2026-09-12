import { apiFetch } from "./client";
import type { WarrantyClaim } from "@/types/warrantyClaim";
import type { VehicleWarranty } from "@/types/vehicleWarranty";

export interface CreateWarrantyClaimInput {
  vehicle_id: string;
  warranty_ids: string[];
  reported_symptom: string;
  reported_mileage: number;
}

export async function listWarrantyClaims(filialId: string): Promise<WarrantyClaim[]> {
  return apiFetch<WarrantyClaim[]>(`/warranty-claims?filial_id=${filialId}`);
}

export async function getVehicleWarrantiesForClaim(vehicleId: string): Promise<VehicleWarranty[]> {
  return apiFetch<VehicleWarranty[]>(`/warranty-claims/vehicles/${vehicleId}/warranties`);
}

export async function createWarrantyClaim(input: CreateWarrantyClaimInput): Promise<WarrantyClaim> {
  return apiFetch<WarrantyClaim>("/warranty-claims", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
