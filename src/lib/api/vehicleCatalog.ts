import { apiFetch } from "./client";
import type { VehicleBrandOption, VehicleModelOption } from "@/types/vehicleCatalog";

export async function listVehicleBrands(
  filialId: string,
  includeInactive = false
): Promise<VehicleBrandOption[]> {
  const query = new URLSearchParams({ filial_id: filialId, include_inactive: String(includeInactive) });
  return apiFetch<VehicleBrandOption[]>(`/vehicle-catalog/brands?${query.toString()}`);
}

export async function createVehicleBrand(filialId: string, name: string): Promise<VehicleBrandOption> {
  return apiFetch<VehicleBrandOption>(`/vehicle-catalog/brands?filial_id=${filialId}`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function renameVehicleBrand(
  filialId: string,
  brandId: string,
  name: string
): Promise<VehicleBrandOption> {
  return apiFetch<VehicleBrandOption>(`/vehicle-catalog/brands/${brandId}?filial_id=${filialId}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
}

export async function setVehicleBrandActive(
  filialId: string,
  brandId: string,
  isActive: boolean
): Promise<VehicleBrandOption> {
  const action = isActive ? "activate" : "deactivate";
  return apiFetch<VehicleBrandOption>(`/vehicle-catalog/brands/${brandId}/${action}?filial_id=${filialId}`, {
    method: "POST",
  });
}

export async function createVehicleModel(
  filialId: string,
  brandId: string,
  name: string,
  vehicleType: string
): Promise<VehicleModelOption> {
  return apiFetch<VehicleModelOption>(`/vehicle-catalog/brands/${brandId}/models?filial_id=${filialId}`, {
    method: "POST",
    body: JSON.stringify({ name, vehicle_type: vehicleType }),
  });
}

export async function updateVehicleModel(
  filialId: string,
  modelId: string,
  patch: { name?: string; vehicleType?: string }
): Promise<VehicleModelOption> {
  return apiFetch<VehicleModelOption>(`/vehicle-catalog/models/${modelId}?filial_id=${filialId}`, {
    method: "PATCH",
    body: JSON.stringify({ name: patch.name, vehicle_type: patch.vehicleType }),
  });
}

export async function setVehicleModelActive(
  filialId: string,
  modelId: string,
  isActive: boolean
): Promise<VehicleModelOption> {
  const action = isActive ? "activate" : "deactivate";
  return apiFetch<VehicleModelOption>(`/vehicle-catalog/models/${modelId}/${action}?filial_id=${filialId}`, {
    method: "POST",
  });
}
