"use client";
import { useCallback, useRef, useState } from "react";
import {
  acknowledgeServiceOrderRequest,
  completeServiceOrderRequest,
  startServiceOrderRequest,
  listServiceOrderRequests,
} from "@/lib/api/warehouse";
import { classifyListError, type ListErrorInfo } from "@/lib/api/listError";
import { useListLoader } from "./useListLoader";
import type { ServiceOrderPartRequest } from "@/types/warehouse";
export function useServiceOrderPartRequests(filialId: string | null) {
  const {
    data: requests,
    loading,
    error,
    refresh,
    setData,
  } = useListLoader<ServiceOrderPartRequest>(
    () => (filialId ? listServiceOrderRequests(filialId) : Promise.resolve([])),
    [filialId],
    filialId ? 15000 : 0,
  );
  const scope = useRef(filialId);
  scope.current = filialId;
  const busy = useRef(false);
  const [action, setAction] = useState<{
    filial: string;
    error: ListErrorInfo | null;
    pending: string | null;
  } | null>(null);
  const actionError = action?.filial === filialId ? action.error : null;
  const pendingId = action?.filial === filialId ? action.pending : null;
  const acknowledge = useCallback(
    async (id: string) => {
      if (!filialId) return;
      try {
        await acknowledgeServiceOrderRequest(filialId, id);
        await refresh();
      } catch (err) {
        if (scope.current === filialId)
          setAction({
            filial: filialId,
            error: classifyListError(err),
            pending: null,
          });
      }
    },
    [filialId, refresh],
  );
  const mutate = useCallback(
    async (
      id: string,
      operation: (filial: string, id: string) => Promise<void>,
    ) => {
      if (!filialId || busy.current) return null;
      busy.current = true;
      setAction({ filial: filialId, error: null, pending: id });
      let committed = false;
      try {
        await operation(filialId, id);
        committed = true;
        const fresh = await listServiceOrderRequests(filialId);
        if (scope.current !== filialId) return null;
        setData(fresh);
        return fresh.find((request) => request.id === id) ?? null;
      } catch (err) {
        if (scope.current === filialId)
          setAction({
            filial: filialId,
            error: committed
              ? {
                  ...classifyListError(err),
                  message:
                    "El cambio se guardó, pero no se pudo actualizar la lista. Actualiza la solicitud para continuar.",
                }
              : classifyListError(err),
            pending: null,
          });
        return null;
      } finally {
        busy.current = false;
        setAction((previous) =>
          previous?.filial === filialId
            ? { ...previous, pending: null }
            : previous,
        );
      }
    },
    [filialId, setData],
  );
  const start = useCallback(
    (id: string) => mutate(id, startServiceOrderRequest),
    [mutate],
  );
  const complete = useCallback(
    (id: string) => mutate(id, completeServiceOrderRequest),
    [mutate],
  );
  return {
    requests,
    loading,
    error,
    actionError,
    pendingId,
    unseenCount: requests.filter((request) => !request.warehouse_seen).length,
    acknowledge,
    complete,
    start,
    refresh,
  };
}
