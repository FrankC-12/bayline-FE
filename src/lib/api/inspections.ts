import { apiFetch } from "./client";
import type { Inspection } from "@/types/inspection";

export interface CreateInspectionInput {
  filial_id: string;
  vehicle_id: string;
  mileage?: number | null;
  notes?: string | null;
  status?: "en_proceso" | "completada";
}

export interface UpdateInspectionInput {
  mileage?: number | null;
  notes?: string | null;
  status?: "en_proceso" | "completada";
  service_order_id?: string;
  clear_service_order?: boolean;
}

export async function listInspections(filialId: string, unlinkedOnly = false): Promise<Inspection[]> {
  return apiFetch<Inspection[]>(`/inspections?filial_id=${filialId}&unlinked_only=${unlinkedOnly}`);
}

export async function getInspectionForOrder(serviceOrderId: string): Promise<Inspection | null> {
  return apiFetch<Inspection | null>(`/inspections/by-order/${serviceOrderId}`);
}

export async function createInspection(input: CreateInspectionInput): Promise<Inspection> {
  return apiFetch<Inspection>("/inspections", { method: "POST", body: JSON.stringify(input) });
}

export async function updateInspection(id: string, input: UpdateInspectionInput): Promise<Inspection> {
  return apiFetch<Inspection>(`/inspections/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export async function deleteInspection(id: string): Promise<void> {
  return apiFetch<void>(`/inspections/${id}`, { method: "DELETE" });
}