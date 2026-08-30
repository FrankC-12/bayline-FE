"use client";

import { useCallback, useEffect, useState } from "react";
import { listSuppliers, createSupplier, updateSupplier, type CreateSupplierInput } from "@/lib/api/administracion";
import type { Supplier } from "@/types/administracion";

export function useSuppliers(filialId: string | null, search?: string) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!filialId) {
      setSuppliers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await listSuppliers(filialId, search);
    setSuppliers(data);
    setLoading(false);
  }, [filialId, search]);

  useEffect(() => {
    load();
  }, [load]);

  const addSupplier = useCallback(async (input: CreateSupplierInput) => {
    const created = await createSupplier(input);
    setSuppliers((prev) => [...prev, created]);
    return created;
  }, []);

  const editSupplier = useCallback(async (id: string, input: Partial<CreateSupplierInput> & { status?: string }) => {
    const updated = await updateSupplier(id, input);
    setSuppliers((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    return updated;
  }, []);

  return { suppliers, loading, addSupplier, editSupplier, refresh: load };
}