"use client";

import { useCallback, useEffect, useState } from "react";
import { listSupplierClaims, createSupplierClaim, updateSupplierClaim } from "@/lib/api/administracion";
import type { SupplierClaim } from "@/types/administracion";

export function useSupplierClaims(filialId: string | null) {
  const [claims, setClaims] = useState<SupplierClaim[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!filialId) {
      setClaims([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await listSupplierClaims(filialId);
    setClaims(data);
    setLoading(false);
  }, [filialId]);

  useEffect(() => {
    load();
  }, [load]);

  const addClaim = useCallback(
    async (input: { part_id: string; quantity: number; supplier_id: string; note?: string | null }) => {
      if (!filialId) return;
      const created = await createSupplierClaim({ filial_id: filialId, ...input });
      setClaims((prev) => [created, ...prev]);
      return created;
    },
    [filialId]
  );

  const editClaim = useCallback(async (id: string, input: { status?: string; return_reference?: string | null }) => {
    const updated = await updateSupplierClaim(id, input);
    setClaims((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    return updated;
  }, []);

  return { claims, loading, addClaim, editClaim, refresh: load };
}