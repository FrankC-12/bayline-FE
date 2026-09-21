"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useHoldingDashboard } from "@/hooks/useHoldingDashboard";
import type { HoldingDashboardReport } from "@/lib/api/holdingDashboard";
import type { ListErrorInfo } from "@/lib/api/listError";

interface HoldingDashboardContextValue {
  data: HoldingDashboardReport | null;
  loading: boolean;
  error: ListErrorInfo | null;
  refresh: () => void;
}

const HoldingDashboardContext = createContext<HoldingDashboardContextValue | undefined>(undefined);

/** One shared fetch of the holding's cross-filial KPI report, instead of
 * every sidebar page calling useHoldingDashboard independently — same fix
 * applied to Upsells earlier: one hook instance, one source of truth,
 * shared by the sidebar and every /holding/* page. */
export function HoldingDashboardProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const value = useHoldingDashboard(currentUser?.holdingId ?? null);
  return <HoldingDashboardContext.Provider value={value}>{children}</HoldingDashboardContext.Provider>;
}

export function useHoldingDashboardContext(): HoldingDashboardContextValue {
  const context = useContext(HoldingDashboardContext);
  if (!context) throw new Error("useHoldingDashboardContext must be used within HoldingDashboardProvider");
  return context;
}
