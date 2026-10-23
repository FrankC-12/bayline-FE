"use client";
import { apiFetch } from "@/lib/api/client";
import { useListLoader } from "./useListLoader";
export interface DetailedInspection {
  created_at?: string;
  updated_at?: string;
  completed_at?: string | null;
  created_by_user_id?: string;
  status: string;
  completed_steps: number;
  total_steps: number;
  completed_by_user_id: string | null;
  updated_by_user_id: string;
  data: {
    [key: string]: unknown;
    observations: string | null;
    engine?: Record<string, unknown>;
    underbody?: Record<string, unknown>;
    tires?: Record<string, unknown>;
    brakes?: Record<string, unknown>;
  };
  annexes: { id: string; filename: string; url: string }[];
}
export function useDetailedInspection(orderId: string) {
  const list = useListLoader<DetailedInspection>(
    async () => {
      const inspection = await apiFetch<DetailedInspection | null>(
        `/detailed-inspections/by-order/${orderId}`,
      );
      return inspection ? [inspection] : [];
    },
    [orderId],
    15000,
  );
  return {
    inspection: list.data[0] ?? null,
    error: list.error?.message ?? null,
    loading: list.loading,
    refresh: list.refresh,
  };
}
