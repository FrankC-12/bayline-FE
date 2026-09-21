"use client";

import { useCallback } from "react";
import {
  listWarrantySubmissions,
  createWarrantySubmission,
  refreshWarrantySubmission,
  submitWarrantySubmission,
  payWarrantySubmission,
  deleteWarrantySubmission,
} from "@/lib/api/administracion";
import type { WarrantySubmission, WarrantySubmissionPayInput } from "@/types/administracion";
import { useListLoader } from "./useListLoader";

export function useWarrantySubmissions(filialId: string | null) {
  const {
    data: submissions,
    setData: setSubmissions,
    loading,
    error,
    refresh,
  } = useListLoader<WarrantySubmission>(
    () => (filialId ? listWarrantySubmissions(filialId) : Promise.resolve([])),
    [filialId]
  );

  const addSubmission = useCallback(
    async (input: { period_year: number; period_month: number; currency: string }) => {
      if (!filialId) return;
      const created = await createWarrantySubmission({ filial_id: filialId, ...input });
      setSubmissions((prev) => [created, ...prev]);
      return created;
    },
    [filialId, setSubmissions]
  );

  const replace = useCallback(
    (updated: WarrantySubmission) => {
      setSubmissions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    },
    [setSubmissions]
  );

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

  const removeOne = useCallback(
    async (id: string) => {
      await deleteWarrantySubmission(id);
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
    },
    [setSubmissions]
  );

  return {
    submissions,
    loading,
    error,
    addSubmission,
    refreshOne,
    submitOne,
    payOne,
    removeOne,
    refresh,
  };
}
