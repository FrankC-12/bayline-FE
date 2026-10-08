"use client";

import { useCallback, useEffect, useState, type DependencyList } from "react";
import { useAutoRefresh } from "./useAutoRefresh";
import { classifyListError, type ListErrorInfo } from "@/lib/api/listError";

/** Shared "fetch a list" state machine — loading/data/error, with a retry
 * that's just the same load function again. Exists so every list hook in
 * the app gets the same guarantee for free: `loading` always eventually
 * becomes false (even when the fetch throws), and a failure is classified
 * (403/500/timeout) instead of left as an opaque thrown error.
 *
 * `fetcher` must not throw for the "nothing to fetch yet" case (e.g. no
 * filialId selected) — resolve with `[]` instead, the same way a real empty
 * result would. */
export function useListLoader<T>(fetcher: () => Promise<T[]>, deps: DependencyList, refreshIntervalMs = 0) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ListErrorInfo | null>(null);

  const load = useCallback(async (background = false) => {
    if (!background) { setLoading(true); setError(null); }
    try {
      setData(await fetcher());
      setError(null);
    } catch (err) {
      if (!background) setError(classifyListError(err));
    } finally {
      if (!background) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  const refreshQuietly = useCallback(() => load(true), [load]);
  useAutoRefresh(refreshQuietly, refreshIntervalMs);

  return { data, setData, loading, error, refresh: load };
}
