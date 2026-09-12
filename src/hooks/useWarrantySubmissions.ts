"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listWarrantySubmissions,
  createWarrantySubmission,
  refreshWarrantySubmission,
  submitWarrantySubmission,
  payWarrantySubmission,
  deleteWarrantySubmission,
} from "@/lib/api/administracion";
import type { WarrantySubmission, WarrantySubmissionPayInput } from "@/types/administracion";

export function useWarrantySubmissions(filialId: string | null) {
  const [submissions, setSubmissions] = useState<WarrantySubmission[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!filialId) {
      setSubmissions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await listWarrantySubmissions(filialId);
    setSubmissions(data);
    setLoading(false);
  }, [filialId]);

  useEffect(() => {
    load();
  }, [load]);

  const addSubmission = useCallback(
    async (input: { period_year: number; period_month: number; currency: string }) => {
      if (!filialId) return;
      const created = await createWarrantySubmission({ filial_id: filialId, ...input });
      setSubmissions((prev) => [created, ...prev]);
      return created;
    },
    [filialId]
  );

  const replace = useCallback((updated: WarrantySubmission) => {
    setSubmissions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }, []);

  const refreshOne = useCallback(
    async (id: string) => {
      const updated = await refreshWarrantySubmission(id);
      replace(updated);
      return updated;
    },
    [replace]
  );

  const submitOne = useCallback(
    async (id: string) => {
      const updated = await submitWarrantySubmission(id);
      replace(updated);
      return updated;
    },
    [replace]
  );

  const payOne = useCallback(
    async (id: string, input: WarrantySubmissionPayInput) => {
      const updated = await payWarrantySubmission(id, input);
      replace(updated);
      return updated;
    },
    [replace]
  );

  const removeOne = useCallback(async (id: string) => {
    await deleteWarrantySubmission(id);
    setSubmissions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return {
    submissions,
    loading,
    addSubmission,
    refreshOne,
    submitOne,
    payOne,
    removeOne,
    refresh: load,
  };
}
