import { apiFetch } from "./client";
import type { Upsell, UpsellApprovalChannel } from "@/types/upsells";

export async function listUpsells(filialId: string): Promise<Upsell[]> {
  return apiFetch<Upsell[]>(`/upsells?filial_id=${filialId}`);
}

export interface CreateUpsellInput {
  title: string;
  description: string;
  evidence_count?: number;
  detected_by_user_id?: string | null;
  tasks?: { tempario_id: string }[];
  parts?: { part_id: string; quantity: number }[];
}

export async function createUpsell(orderId: string, input: CreateUpsellInput): Promise<Upsell> {
  return apiFetch<Upsell>(`/service-orders/${orderId}/upsells`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export interface DecideUpsellInput {
  status: "aprobado" | "rechazado" | "pospuesto";
  // Required by the server when status="aprobado" — how the client
  // actually agreed to pay for the additional work.
  approval_channel?: UpsellApprovalChannel;
}

export async function decideUpsell(upsellId: string, input: DecideUpsellInput): Promise<Upsell> {
  return apiFetch<Upsell>(`/upsells/${upsellId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
