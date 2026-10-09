"use client";

import { useEffect } from "react";

/** Refresh visible screens and catch changes made by another device. */
export function useAutoRefresh(refresh: () => Promise<unknown>, intervalMs = 15000) {
  useEffect(() => {
    if (intervalMs <= 0) return;
    let running = false;
    let disposed = false;
    const run = async () => {
      if (disposed || running || document.visibilityState === "hidden") return;
      running = true;
      try { await refresh(); }
      catch { /* Keep the last successful data on a failed background request. */ }
      finally { running = false; }
    };
    const onVisible = () => { void run(); };
    const timer = setInterval(onVisible, intervalMs);
    window.addEventListener("focus", onVisible);
    window.addEventListener("bayline:workshop-updated", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      disposed = true;
      clearInterval(timer);
      window.removeEventListener("focus", onVisible);
      window.removeEventListener("bayline:workshop-updated", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh, intervalMs]);
}
