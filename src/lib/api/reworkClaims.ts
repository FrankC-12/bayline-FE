import { apiFetch } from "./client";
import type { ReworkClaim, ReworkFailureCategory } from "@/types/reworkClaim";

export interface CreateReworkClaimInput {
  tempario_id?: string | null;
  part_id?: string | null;
  // Optional — the cause may not be known yet the day the client complains.
  // Required to close the claim (see CloseReworkClaimInput).
  failure_category?: ReworkFailureCategory | null;
  failure_cause: string;
  claimed_at?: string;
  note?: string | null;
}

export interface CloseReworkClaimInput {
  failure_category?: ReworkFailureCategory | null;
  note?: string | null;
}

export interface AuthorizeReworkClaimInput {
  decision: "aprobado" | "rechazado";
  warranty_override?: boolean;
  warranty_override_note?: string | null;
  intake_mileage?: number | null;
  promised_at?: string | null;
}

export async function listReworkClaims(orderId: string): Promise<ReworkClaim[]> {
  return apiFetch<ReworkClaim[]>(`/service-orders/${orderId}/rework-claims`);
}

export async function createReworkClaim(
  orderId: string,
  input: CreateReworkClaimInput
): Promise<ReworkClaim> {
  return apiFetch<ReworkClaim>(`/service-orders/${orderId}/rework-claims`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function closeReworkClaim(
  orderId: string,
  claimId: string,
  input: CloseReworkClaimInput
): Promise<ReworkClaim> {
  return apiFetch<ReworkClaim>(`/service-orders/${orderId}/rework-claims/${claimId}/close`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function authorizeReworkClaim(
  orderId: string,
  claimId: string,
  input: AuthorizeReworkClaimInput
): Promise<ReworkClaim> {
  return apiFetch<ReworkClaim>(`/service-orders/${orderId}/rework-claims/${claimId}/authorize`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
