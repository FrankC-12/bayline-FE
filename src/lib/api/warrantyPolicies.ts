import { apiFetch } from "./client";
import type {
  WarrantyPolicy,
  WarrantyPolicyAppliesTo,
  WarrantyPolicyCoveredBy,
  WarrantyPolicyScope,
  WarrantyPolicyStatus,
} from "@/types/warrantyPolicy";

export interface CreateWarrantyPolicyInput {
  filial_id: string;
  name: string;
  applies_to: WarrantyPolicyAppliesTo;
  covered_by: WarrantyPolicyCoveredBy;
  scope: WarrantyPolicyScope;
  no_expiration: boolean;
  duration_days?: number | null;
  duration_km?: number | null;
  status?: WarrantyPolicyStatus;
  tempario_ids?: string[];
  part_ids?: string[];
}

export interface UpdateWarrantyPolicyInput {
  name?: string;
  applies_to?: WarrantyPolicyAppliesTo;
  covered_by?: WarrantyPolicyCoveredBy;
  scope?: WarrantyPolicyScope;
  no_expiration?: boolean;
  duration_days?: number | null;
  duration_km?: number | null;
  clear_duration_days?: boolean;
  clear_duration_km?: boolean;
  status?: WarrantyPolicyStatus;
  tempario_ids?: string[];
  part_ids?: string[];
}

export async function listWarrantyPolicies(
  filialId: string,
  options?: {
    search?: string;
    status?: WarrantyPolicyStatus;
    appliesTo?: WarrantyPolicyAppliesTo;
    coveredBy?: WarrantyPolicyCoveredBy;
  }
): Promise<WarrantyPolicy[]> {
  const query = new URLSearchParams({ filial_id: filialId });
  if (options?.search) query.set("search", options.search);
  if (options?.status) query.set("policy_status", options.status);
  if (options?.appliesTo) query.set("applies_to", options.appliesTo);
  if (options?.coveredBy) query.set("covered_by", options.coveredBy);
  return apiFetch<WarrantyPolicy[]>(`/warranty-policies?${query.toString()}`);
}

export async function getWarrantyPolicy(id: string): Promise<WarrantyPolicy> {
  return apiFetch<WarrantyPolicy>(`/warranty-policies/${id}`);
}

export async function createWarrantyPolicy(input: CreateWarrantyPolicyInput): Promise<WarrantyPolicy> {
  return apiFetch<WarrantyPolicy>("/warranty-policies", { method: "POST", body: JSON.stringify(input) });
}

export async function updateWarrantyPolicy(
  id: string,
  input: UpdateWarrantyPolicyInput
): Promise<WarrantyPolicy> {
  return apiFetch<WarrantyPolicy>(`/warranty-policies/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}
