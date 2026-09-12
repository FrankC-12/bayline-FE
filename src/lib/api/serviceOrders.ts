import type { DiscountLabel } from "@/lib/partsPricing";
import { apiFetch } from "./client";
import type { ServiceOrder, Bay, OrderSummary, ServiceOrderPayer } from "@/types/serviceOrder";

export interface CreateServiceOrderInput {
  discount_label?: DiscountLabel;
  filial_id: string;
  vehicle_id: string;
  order_type?: string;
  // Optional — a walk-in ODS collects it right away (vehicle present), but
  // one scheduled ahead of time can't know it yet; it's recorded later via
  // UpdateServiceOrderInput once the vehicle arrives.
  intake_mileage?: number | null;
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
  intake_mileage?: number | null;
  clear_technician?: boolean;
  clear_advisor?: boolean;
  clear_bay?: boolean;
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

export async function markTransferOrdered(transferId: string): Promise<void> {
  await apiFetch(`/service-order-transfers/${transferId}/mark-ordered`, { method: "POST" });
}