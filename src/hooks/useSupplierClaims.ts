"use client";

import { useCallback } from "react";
import { listSupplierClaims, createSupplierClaim, updateSupplierClaim, resolveSupplierClaim } from "@/lib/api/administracion";
import type { SupplierClaim, SupplierClaimResolveInput } from "@/types/administracion";
import { useListLoader } from "./useListLoader";

export function useSupplierClaims(filialId: string | null) {
  const {
    data: claims,
    setData: setClaims,
    loading,
    error,
    refresh,
  } = useListLoader<SupplierClaim>(() => (filialId ? listSupplierClaims(filialId) : Promise.resolve([])), [filialId]);

  const addClaim = useCallback(
    async (input: {
      part_id: string;
      quantity: number;
      supplier_id: string;
      note?: string | null;
      claimed_amount?: number | null;
      currency?: string | null;
      client_id?: string | null;
    }) => {
      if (!filialId) return;
      const created = await createSupplierClaim({ filial_id: filialId, ...input });
      setClaims((prev) => [created, ...prev]);
      return created;
    },
    [filialId, setClaims]
  );

  const editClaim = useCallback(
    async (
      id: string,
      input: {
        status?: string;
        return_reference?: string | null;
        claimed_amount?: number | null;
        currency?: string | null;
        client_id?: string | null;
      }
    ) => {
      const updated = await updateSupplierClaim(id, input);
      setClaims((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      return updated;
    },
    [setClaims]
  );

  const resolveClaim = useCallback(
    async (id: string, input: SupplierClaimResolveInput) => {
      const updated = await resolveSupplierClaim(id, input);
      setClaims((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      return updated;
    },
    [setClaims]
  );

  return { claims, loading, error, addClaim, editClaim, resolveClaim, refresh };
}
