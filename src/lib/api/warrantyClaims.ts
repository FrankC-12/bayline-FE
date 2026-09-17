import { apiFetch } from "./client";
import type { ReworkFailureCategory, WarrantyClaim, WarrantyClaimContext, WarrantyClaimType } from "@/types/warrantyClaim";

export interface CreateWarrantyClaimInput {
  claim_type: WarrantyClaimType;
  vehicle_id: string;
  service_order_id?: string | null;
  tempario_id?: string | null;
  part_id?: string | null;
  failure_category?: ReworkFailureCategory | null;
  failure_cause?: string | null;
  reported_symptom?: string | null;
  reported_mileage: number;
  claimed_at?: string;
  note?: string | null;
}

export interface AuthorizeWarrantyClaimInput {
  decision: "aprobado" | "rechazado";
  warranty_override?: boolean;
  warranty_override_note?: string | null;
  failure_category?: ReworkFailureCategory | null;
}

export interface ConvertWarrantyClaimInput {
  intake_mileage?: number | null;
  promised_at?: string | null;
}

export async function getWarrantyClaimContext(
  vehicleId: string,
  serviceOrderId?: string | null,
  temparioId?: string | null,
  partId?: string | null
): Promise<WarrantyClaimContext> {
  const query = new URLSearchParams({ vehicle_id: vehicleId });
  if (serviceOrderId) query.set("service_order_id", serviceOrderId);
  if (temparioId) query.set("tempario_id", temparioId);
  if (partId) query.set("part_id", partId);
  return apiFetch<WarrantyClaimContext>(`/warranty-claims/context?${query.toString()}`);
}

export async function listWarrantyClaims(
  filialId: string,
  filters?: { status?: string; vehicleId?: string; serviceOrderId?: string }
): Promise<WarrantyClaim[]> {
  const query = new URLSearchParams({ filial_id: filialId });
  if (filters?.status) query.set("status", filters.status);
  if (filters?.vehicleId) query.set("vehicle_id", filters.vehicleId);
  if (filters?.serviceOrderId) query.set("service_order_id", filters.serviceOrderId);
  return apiFetch<WarrantyClaim[]>(`/warranty-claims?${query.toString()}`);
}

export async function getWarrantyClaim(claimId: string): Promise<WarrantyClaim> {
  return apiFetch<WarrantyClaim>(`/warranty-claims/${claimId}`);
}

export async function createWarrantyClaim(
  input: CreateWarrantyClaimInput,
  photos: File[],
  documents: File[]
): Promise<WarrantyClaim> {
  const form = new FormData();
  for (const [key, value] of Object.entries(input)) {
    if (value !== null && value !== undefined) form.append(key, String(value));
  }
  for (const photo of photos) form.append("photos", photo);
  for (const document of documents) form.append("documents", document);
  return apiFetch<WarrantyClaim>("/warranty-claims", { method: "POST", body: form });
}

export async function authorizeWarrantyClaim(
  claimId: string,
  input: AuthorizeWarrantyClaimInput
): Promise<WarrantyClaim> {
  return apiFetch<WarrantyClaim>(`/warranty-claims/${claimId}/authorize`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function convertWarrantyClaimToOrder(
  claimId: string,
  input: ConvertWarrantyClaimInput = {}
): Promise<WarrantyClaim> {
  return apiFetch<WarrantyClaim>(`/warranty-claims/${claimId}/convert-to-order`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
