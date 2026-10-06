"use client";

import { useCallback } from "react";
import { listReceivables, collectReceivable, type Receivable, type CollectInvoicePaymentInput } from "@/lib/api/serviceOrderBilling";
import { useListLoader } from "./useListLoader";

export function useReceivables(filialId: string | null) {
  const {
    data: receivables,
    setData: setReceivables,
    loading,
    error,
    refresh,
  } = useListLoader<Receivable>(
    () => (filialId ? listReceivables(filialId) : Promise.resolve([])),
    [filialId]
  );

  const collectOne = useCallback(
    async (invoiceId: string, input: CollectInvoicePaymentInput) => {
      const updated = await collectReceivable(invoiceId, input);
      setReceivables((prev) => updated.pending_amount <= 0
        ? prev.filter((r) => r.invoice_id !== invoiceId)
        : prev.map((r) => r.invoice_id === invoiceId ? updated : r));
    },
    [setReceivables]
  );

  return { receivables, loading, error, collectOne, refresh };
}
