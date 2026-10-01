import { apiFetch } from "./client";
import type { Inspection } from "@/types/inspection";

export interface CreateInspectionDamageInput {
  x: number;
  y: number;
  zone: string;
  kind: string;
  severity: string;
  description?: string | null;
}

export interface CreateInspectionInput {
  filial_id: string;
  vehicle_id: string;
  mileage?: number | null;
  notes?: string | null;
  status?: "en_proceso" | "completada";
  damages?: CreateInspectionDamageInput[];
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

export async function uploadDamagePhoto(
  inspectionId: string,
  damageId: string,
  photo: File
): Promise<Inspection> {
  const form = new FormData();
  form.append("photo", photo);
  return apiFetch<Inspection>(`/inspections/${inspectionId}/damages/${damageId}/photo`, {
    method: "POST",
    body: form,
  });
}

export async function uploadInspectionPhotos(inspectionId: string, photos: File[]): Promise<Inspection> {
  const form = new FormData();
  for (const photo of photos) form.append("photos", photo);
  return apiFetch<Inspection>(`/inspections/${inspectionId}/photos`, { method: "POST", body: form });
}