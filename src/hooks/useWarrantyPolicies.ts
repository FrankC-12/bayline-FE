"use client";

import { useCallback } from "react";
import {
  listWarrantyPolicies,
  createWarrantyPolicy,
  updateWarrantyPolicy,
  type CreateWarrantyPolicyInput,
  type UpdateWarrantyPolicyInput,
} from "@/lib/api/warrantyPolicies";
import type { WarrantyPolicy, WarrantyPolicyAppliesTo, WarrantyPolicyCoveredBy, WarrantyPolicyStatus } from "@/types/warrantyPolicy";
import { useListLoader } from "./useListLoader";

export function useWarrantyPolicies(
  filialId: string | null,
  options?: { search?: string; status?: WarrantyPolicyStatus; appliesTo?: WarrantyPolicyAppliesTo; coveredBy?: WarrantyPolicyCoveredBy }
) {
  const {
    data: policies,
    setData: setPolicies,
    loading,
    error,
    refresh,
  } = useListLoader<WarrantyPolicy>(
    () => (filialId ? listWarrantyPolicies(filialId, options) : Promise.resolve([])),
    [filialId, options?.search, options?.status, options?.appliesTo, options?.coveredBy]
  );

  const addPolicy = useCallback(
    async (input: CreateWarrantyPolicyInput) => {
      const created = await createWarrantyPolicy(input);
      setPolicies((prev) => [...prev, created]);
      return created;
    },
    [setPolicies]
  );

  const editPolicy = useCallback(
    async (id: string, input: UpdateWarrantyPolicyInput) => {
      const updated = await updateWarrantyPolicy(id, input);
      setPolicies((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      return updated;
    },
    [setPolicies]
  );

  return { policies, loading, error, addPolicy, editPolicy, refresh };
}
