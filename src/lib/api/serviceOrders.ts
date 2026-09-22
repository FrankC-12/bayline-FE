import type { DiscountLabel } from "@/lib/partsPricing";
import { apiFetch } from "./client";
import type { ServiceOrder, Bay, OrderSummary, ServiceOrderPayer } from "@/types/serviceOrder";

export interface CreateServiceOrderInput {
  discount_label?: DiscountLabel;
  filial_id: string;
  vehicle_id: string;
  order_type?: string;
  // intake_mileage is never sent — it's always a read-only view inherited
  // from a PreliminaryInspection, derived server-side. A walk-in ODS (no
  // scheduled_at) must pass an existing unlinked inspection_id for the
  // vehicle; one scheduled ahead of time can omit it and link an inspection
  // later, from the order detail screen, once the vehicle arrives.
  inspection_id?: string;
  customer_reason: string;
  advisor_user_id: string;
  promised_at: string;
  notes?: string | null;
  scheduled_at?: string | null;
  technician_user_id?: string | null;
  bay_id?: string | null;
}

export interface UpdateServiceOrderInput {
  discount_label?: DiscountLabel;
  status?: string;
  order_type?: string;
  technician_user_id?: string | null;
  advisor_user_id?: string | null;
  bay_id?: string | null;
  scheduled_at?: string | null;
  notes?: string | null;
  clear_technician?: boolean;
  clear_advisor?: boolean;
  clear_bay?: boolean;
  // Only meaningful when status="completado" while a task or ODT isn't
  // finished — the server decides that, this just carries the explicit
  // confirmation to go ahead anyway.
  confirm_incomplete_completion?: boolean;
}

export async function listServiceOrders(
  filialId: string,
  view: "active" | "history" | "all" = "active",
  date?: string
): Promise<ServiceOrder[]> {
  const query = new URLSearchParams({ filial_id: filialId, view });
  if (date) query.set("date", date);
  return apiFetch<ServiceOrder[]>(`/service-orders?${query.toString()}`);
}

export async function getServiceOrder(id: string): Promise<ServiceOrder> {
  return apiFetch<ServiceOrder>(`/service-orders/${id}`);
}

export async function createServiceOrder(input: CreateServiceOrderInput): Promise<ServiceOrder> {
  return apiFetch<ServiceOrder>("/service-orders", { method: "POST", body: JSON.stringify(input) });
}

export async function updateServiceOrder(
  id: string,
  input: UpdateServiceOrderInput
): Promise<ServiceOrder> {
  return apiFetch<ServiceOrder>(`/service-orders/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function cancelServiceOrder(id: string, reason: string): Promise<ServiceOrder> {
  return apiFetch<ServiceOrder>(`/service-orders/${id}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function reopenServiceOrder(id: string): Promise<ServiceOrder> {
  return apiFetch<ServiceOrder>(`/service-orders/${id}/reopen`, { method: "POST" });
}

export async function listBays(filialId: string): Promise<Bay[]> {
  return apiFetch<Bay[]>(`/bays?filial_id=${filialId}`);
}

export async function createBay(filialId: string, name: string): Promise<Bay> {
  return apiFetch<Bay>(`/bays?filial_id=${filialId}`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function updateBay(
  id: string,
  input: { name?: string; is_active?: boolean }
): Promise<Bay> {
  return apiFetch<Bay>(`/bays/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export async function getOrderSummary(orderId: string): Promise<OrderSummary> {
  return apiFetch<OrderSummary>(`/service-orders/${orderId}/summary`);
}

export async function addTask(
  orderId: string,
  temparioId: string,
  payer: ServiceOrderPayer = "cliente"
): Promise<OrderSummary> {
  return apiFetch<OrderSummary>(`/service-orders/${orderId}/tasks`, {
    method: "POST",
    body: JSON.stringify({ tempario_id: temparioId, payer }),
  });
}

export async function updateTaskStatus(taskId: string, status: string): Promise<void> {
  await apiFetch(`/service-order-tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function updateTaskPayer(
  orderId: string,
  taskId: string,
  payer: ServiceOrderPayer
): Promise<OrderSummary> {
  return apiFetch<OrderSummary>(`/service-orders/${orderId}/tasks/${taskId}/payer`, {
    method: "PATCH",
    body: JSON.stringify({ payer }),
  });
}

export async function deleteTask(taskId: string): Promise<void> {
  await apiFetch(`/service-order-tasks/${taskId}`, { method: "DELETE" });
}

export async function addTransferLine(
  orderId: string,
  partId: string,
  quantity: number,
  payer: ServiceOrderPayer = "cliente"
): Promise<OrderSummary> {
  return apiFetch<OrderSummary>(`/service-orders/${orderId}/transfers/lines`, {
    method: "POST",
    body: JSON.stringify({ part_id: partId, quantity, payer }),
  });
}

export async function updateTransferLinePayer(
  orderId: string,
  lineId: string,
  payer: ServiceOrderPayer
): Promise<OrderSummary> {
  return apiFetch<OrderSummary>(`/service-orders/${orderId}/transfers/lines/${lineId}/payer`, {
    method: "PATCH",
    body: JSON.stringify({ payer }),
  });
}

export async function updateTransferLineQuantity(
  orderId: string,
  lineId: string,
  quantity: number
): Promise<OrderSummary> {
  return apiFetch<OrderSummary>(`/service-orders/${orderId}/transfers/lines/${lineId}/quantity`, {
    method: "PATCH",
    body: JSON.stringify({ quantity }),
  });
}

export async function removeTransferLine(orderId: string, lineId: string): Promise<OrderSummary> {
  return apiFetch<OrderSummary>(`/service-orders/${orderId}/transfers/lines/${lineId}`, {
    method: "DELETE",
  });
}

export async function markTransferOrdered(transferId: string): Promise<void> {
  await apiFetch(`/service-order-transfers/${transferId}/mark-ordered`, { method: "POST" });
}