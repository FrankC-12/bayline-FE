"use client";

import { useCallback, useEffect, useState } from "react";
import { listReceivables, collectReceivable, type Receivable, type CollectInvoicePaymentInput } from "@/lib/api/serviceOrderBilling";

export function useReceivables(filialId: string | null) {
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!filialId) {
      setReceivables([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await listReceivables(filialId);
    setReceivables(data);
    setLoading(false);
  }, [filialId]);

  useEffect(() => {
    load();
  }, [load]);

  const collectOne = useCallback(async (invoiceId: string, input: CollectInvoicePaymentInput) => {
    await collectReceivable(invoiceId, input);
    setReceivables((prev) => prev.filter((r) => r.invoice_id !== invoiceId));
  }, []);

  return { receivables, loading, collectOne, refresh: load };
}
