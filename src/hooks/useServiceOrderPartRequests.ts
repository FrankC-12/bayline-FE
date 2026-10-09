"use client";

import { useCallback, useEffect, useState } from "react";
import { acknowledgeServiceOrderRequest, completeServiceOrderRequest, startServiceOrderRequest, listServiceOrderRequests } from "@/lib/api/warehouse";
import { classifyListError, type ListErrorInfo } from "@/lib/api/listError";
import { useListLoader } from "./useListLoader";
import type { ServiceOrderPartRequest } from "@/types/warehouse";

export function useServiceOrderPartRequests(filialId: string | null) {
  const { data: requests, loading, error, refresh } = useListLoader<ServiceOrderPartRequest>(
    () => filialId ? listServiceOrderRequests(filialId) : Promise.resolve([]), [filialId], filialId ? 15000 : 0
  );
  const [actionError, setActionError] = useState<ListErrorInfo | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  useEffect(() => { setActionError(null); }, [filialId]);

  const acknowledge = useCallback(async (transferId: string) => {
    if (!filialId) return;
    try { await acknowledgeServiceOrderRequest(filialId, transferId); await refresh(); }
    catch (err) { setActionError(classifyListError(err)); }
  }, [filialId, refresh]);
  const complete = useCallback(async (transferId: string) => {
    if (!filialId || pendingId) return;
    setPendingId(transferId); setActionError(null);
    try { await completeServiceOrderRequest(filialId, transferId); await refresh(); }
    catch (err) { setActionError(classifyListError(err)); }
    finally { setPendingId(null); }
  }, [filialId, pendingId, refresh]);

  const start = useCallback(async (transferId: string) => {
    if (!filialId || pendingId) return;
    setPendingId(transferId); setActionError(null);
    try { await startServiceOrderRequest(filialId, transferId); await refresh(); }
    catch (err) { setActionError(classifyListError(err)); }
    finally { setPendingId(null); }
  }, [filialId, pendingId, refresh]);

  return { requests, loading, error, actionError, pendingId,
    unseenCount: requests.filter((r) => !r.warehouse_seen).length,
    acknowledge, complete, start, refresh };
}
