"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type DependencyList,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useAutoRefresh } from "./useAutoRefresh";
import { classifyListError, type ListErrorInfo } from "@/lib/api/listError";

type LoadScope = { active: boolean; revision: number; foreground: boolean; loaded: boolean };
type ListState<T> = {
  scope: LoadScope;
  data: T[];
  loading: boolean;
  error: ListErrorInfo | null;
};

/** Partial refresh failures preserve data. Only the newest request for the
 * current dependency scope can publish results; changing filial clears the
 * previous scope immediately, and cleanup invalidates outstanding requests. */
export function useListLoader<T>(
  fetcher: () => Promise<T[]>,
  deps: DependencyList,
  refreshIntervalMs = 0,
) {
  // The caller defines which values identify the list, as with useCallback.
  const scope = useMemo<LoadScope>(
    () => ({ active: true, revision: 0, foreground: false, loaded: false }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps,
  );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchList = useCallback(fetcher, deps);
  const [state, setState] = useState<ListState<T>>({
    scope,
    data: [],
    loading: true,
    error: null,
  });

  const load = useCallback(
    async (background = false) => {
      if (!scope.active || (background && scope.foreground)) return;
      const revision = ++scope.revision;
      if (!background) {
        scope.foreground = true;
        setState((previous) => ({
          scope,
          data: previous.scope === scope ? previous.data : [],
          loading: true,
          error: null,
        }));
      }
      try {
        const data = await fetchList();
        if (scope.active && scope.revision === revision) {
          scope.loaded = true;
        setState({ scope, data, loading: false, error: null });
        }
      } catch (err) {
        if (scope.active && scope.revision === revision && !background) {
          setState((previous) => ({
            scope,
            data: previous.scope === scope ? previous.data : [],
            loading: false,
            error: classifyListError(err),
          }));
        }
      } finally {
        if (scope.revision === revision) scope.foreground = false;
      }
    },
    [scope, fetchList],
  );

  useEffect(() => {
    scope.active = true;
    void load();
    return () => {
      scope.active = false;
      ++scope.revision;
      scope.foreground = false;
    };
  }, [scope, load]);

  const refresh = useCallback(() => load(), [load]);
  const refreshQuietly = useCallback(() => load(true), [load]);
  useAutoRefresh(refreshQuietly, refreshIntervalMs);

  const setData: Dispatch<SetStateAction<T[]>> = useCallback(
    (update) => {
      if (!scope.active) return;
      // A successful mutation is newer than any request already in flight.
      // Those responses must not restore the pre-edit list or its error state.
      ++scope.revision;
      scope.foreground = false;
      setState((previous) => {
        const data = previous.scope === scope ? previous.data : [];
        return {
          scope,
          data: typeof update === "function" ? update(data) : update,
          loading: false,
          error: null,
        };
      });
      // If an item was created before the initial list arrived, reload the
      // complete list so invalidating that request does not hide other rows.
      if (!scope.loaded) void load(true);
    },
    [scope, load],
  );

  return {
    data: state.scope === scope ? state.data : [],
    setData,
    loading: state.scope === scope ? state.loading : true,
    error: state.scope === scope ? state.error : null,
    refresh,
  };
}
