import { apiFetch } from "./client";
import type { PendingUpsell, Upsell, UpsellApprovalChannel, UpsellDiscardReason, UpsellSeverity } from "@/types/upsells";

export async function listUpsells(filialId: string): Promise<Upsell[]> {
  return apiFetch<Upsell[]>(`/upsells?filial_id=${filialId}`);
}

export async function getPendingUpsellsForVehicle(
  vehicleId: string,
  excludeOrderId?: string
): Promise<PendingUpsell[]> {
  const query = new URLSearchParams({ vehicle_id: vehicleId });
  if (excludeOrderId) query.set("exclude_order_id", excludeOrderId);
  return apiFetch<PendingUpsell[]>(`/upsells/pending-by-vehicle?${query.toString()}`);
}

export interface CreateUpsellInput {
  title: string;
  description: string;
  severity: UpsellSeverity;
  detected_by_user_id?: string | null;
  tasks?: { tempario_id: string }[];
  parts?: { part_id: string; quantity: number }[];
}

export async function createUpsell(
  orderId: string,
  input: CreateUpsellInput,
  photos: File[] = []
): Promise<Upsell> {
  const form = new FormData();
  form.append("title", input.title);
  form.append("description", input.description);
  form.append("severity", input.severity);
  if (input.detected_by_user_id) form.append("detected_by_user_id", input.detected_by_user_id);
  form.append("tasks_json", JSON.stringify(input.tasks ?? []));
  form.append("parts_json", JSON.stringify(input.parts ?? []));
  for (const photo of photos) form.append("photos", photo);
  return apiFetch<Upsell>(`/service-orders/${orderId}/upsells`, { method: "POST", body: form });
}

export interface DecideUpsellInput {
  status: "aprobado" | "rechazado" | "pospuesto";
  // Required by the server when status="aprobado" — how the client
  // actually agreed to pay for the additional work.
  approval_channel?: UpsellApprovalChannel;
  // Only meaningful for status="aprobado" — which ODS to add the tasks/
  // parts to. Omit to use the upsell's own order (same-visit decision);
  // set explicitly when applying a pending/postponed recommendation from
  // a past visit to the ODS open right now.
  target_service_order_id?: string;
  // Required by the server when status="rechazado" ("Descartar").
  discard_reason?: UpsellDiscardReason;
  discard_note?: string;
}

export async function decideUpsell(upsellId: string, input: DecideUpsellInput): Promise<Upsell> {
  return apiFetch<Upsell>(`/upsells/${upsellId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
