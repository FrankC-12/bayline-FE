"use client";

import { useCallback } from "react";
import { listSuppliers, createSupplier, updateSupplier, type CreateSupplierInput } from "@/lib/api/administracion";
import type { Supplier } from "@/types/administracion";
import { useListLoader } from "./useListLoader";

export function useSuppliers(filialId: string | null, search?: string) {
  const {
    data: suppliers,
    setData: setSuppliers,
    loading,
    error,
    refresh,
  } = useListLoader<Supplier>(() => (filialId ? listSuppliers(filialId, search) : Promise.resolve([])), [filialId, search]);

  const addSupplier = useCallback(
    async (input: CreateSupplierInput) => {
      const created = await createSupplier(input);
      setSuppliers((prev) => [...prev, created]);
      return created;
    },
    [setSuppliers]
  );

  const editSupplier = useCallback(
    async (id: string, input: Partial<CreateSupplierInput> & { status?: string }) => {
      const updated = await updateSupplier(id, input);
      setSuppliers((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      return updated;
    },
    [setSuppliers]
  );

  return { suppliers, loading, error, addSupplier, editSupplier, refresh };
}
