"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUpsells } from "@/hooks/useUpsells";
import type { Upsell } from "@/types/upsells";
import type { CreateUpsellInput, DecideUpsellInput } from "@/lib/api/upsells";
import type { ListErrorInfo } from "@/lib/api/listError";

interface UpsellsContextValue {
  upsells: Upsell[];
  loading: boolean;
  error: ListErrorInfo | null;
  addUpsell: (orderId: string, input: CreateUpsellInput, photos?: File[]) => Promise<Upsell>;
  decide: (upsellId: string, input: DecideUpsellInput) => Promise<Upsell>;
  refresh: () => void;
}

const UpsellsContext = createContext<UpsellsContextValue | undefined>(undefined);

/** One shared fetch of the filial's upsells, instead of every consumer
 * (the sidebar's pending-count badge, UpsellsView's own list) calling
 * useUpsells independently — those were two separate useListLoader
 * instances with two separate state copies, so creating/deciding an upsell
 * from the list never updated the badge next to the "Upsells" tab until
 * the whole layout happened to remount. */
export function UpsellsProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const value = useUpsells(currentUser?.filialId ?? null);
  return <UpsellsContext.Provider value={value}>{children}</UpsellsContext.Provider>;
}

export function useUpsellsContext(): UpsellsContextValue {
  const context = useContext(UpsellsContext);
  if (!context) throw new Error("useUpsellsContext must be used within UpsellsProvider");
  return context;
}
