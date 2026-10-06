import { apiFetch } from "./client";
import type { ServiceOrderTypeCatalog } from "@/types/serviceOrderType";

export interface CreateServiceOrderTypeInput {
  filial_id: string;
  name: string;
  description?: string | null;
}

export interface UpdateServiceOrderTypeInput {
  name?: string;
  description?: string | null;
  is_active?: boolean;
}

export async function listServiceOrderTypes(filialId: string): Promise<ServiceOrderTypeCatalog[]> {
  return apiFetch<ServiceOrderTypeCatalog[]>(`/service-order-types?filial_id=${filialId}`);
}

export async function createServiceOrderType(
  input: CreateServiceOrderTypeInput
): Promise<ServiceOrderTypeCatalog> {
  return apiFetch<ServiceOrderTypeCatalog>("/service-order-types", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateServiceOrderType(
  id: string,
  input: UpdateServiceOrderTypeInput
): Promise<ServiceOrderTypeCatalog> {
  return apiFetch<ServiceOrderTypeCatalog>(`/service-order-types/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
