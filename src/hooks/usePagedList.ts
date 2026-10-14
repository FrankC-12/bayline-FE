"use client";
import { useState } from "react";
import { useListLoader } from "./useListLoader";

import type { Page } from "@/types/pagination";

export function usePagedList<T>(fetcher: (page: number, size: number) => Promise<Page<T>>, scope: string, intervalMs = 0) {
  const [pageSize, setPageSize] = useState(30);
  const queryScope = JSON.stringify([scope, pageSize]);
  const [selection, setSelection] = useState({scope: queryScope, page: 1});
  const page = selection.scope === queryScope ? selection.page : 1;
  const {data, loading, error, refresh} = useListLoader<Page<T>>(
    () => fetcher(page, pageSize).then((result) => [result]), [queryScope, page], intervalMs,
  );
  const result = data[0];
  return {items: result?.items ?? [], total: result?.total ?? 0,
    page: result?.page ?? page, totalPages: result?.total_pages ?? 1,
    pageSize, setPageSize, setPage: (next: number) => setSelection({scope: queryScope, page: next}),
    loading, error, refresh};
}
