"use client";

import { useCallback, useEffect, useState } from "react";
import { getHoldingDashboard, type HoldingDashboardReport } from "@/lib/api/holdingDashboard";
import { classifyListError, type ListErrorInfo } from "@/lib/api/listError";

/** Same loading/error/retry contract as useListLoader, for a single report
 * object instead of a list — the holding summary dashboard is one fetch
 * shared by the sidebar and every per-area page (see HoldingDashboardContext),
 * not a list that gets paginated/filtered client-side. */
export function useHoldingDashboard(holdingId: string | null) {
  const [data, setData] = useState<HoldingDashboardReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ListErrorInfo | null>(null);

  const load = useCallback(async () => {
    if (!holdingId) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setData(await getHoldingDashboard(holdingId));
    } catch (err) {
      setError(classifyListError(err));
    } finally {
      setLoading(false);
    }
  }, [holdingId]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refresh: load };
}
