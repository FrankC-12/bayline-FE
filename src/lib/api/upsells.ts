import { apiFetch } from "./client";
import type { Upsell } from "@/types/upsells";

export async function listUpsells(filialId: string): Promise<Upsell[]> {
  return apiFetch<Upsell[]>(`/upsells?filial_id=${filialId}`);
}

export interface CreateUpsellInput {
  title: string;
  description: string;
  evidence_count?: number;
  detected_by_user_id?: string | null;
}

export async function createUpsell(orderId: string, input: CreateUpsellInput): Promise<Upsell> {
  return apiFetch<Upsell>(`/service-orders/${orderId}/upsells`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateUpsellStatus(upsellId: string, status: string): Promise<Upsell> {
  return apiFetch<Upsell>(`/upsells/${upsellId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}