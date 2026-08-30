import { apiFetch } from "./client";
import type { ServiceOrder, Bay, OrderSummary } from "@/types/serviceOrder";

export interface CreateServiceOrderInput {
  filial_id: string;
  vehicle_id: string;
  order_type?: string;
  notes?: string | null;
  scheduled_at?: string | null;
  technician_user_id?: string | null;
  bay_id?: string | null;
}

export interface UpdateServiceOrderInput {
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

export async function addTask(orderId: string, temparioId: string): Promise<OrderSummary> {
  return apiFetch<OrderSummary>(`/service-orders/${orderId}/tasks`, {
    method: "POST",
    body: JSON.stringify({ tempario_id: temparioId }),
  });
}

export async function updateTaskStatus(taskId: string, status: string): Promise<void> {
  await apiFetch(`/service-order-tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function deleteTask(taskId: string): Promise<void> {
  await apiFetch(`/service-order-tasks/${taskId}`, { method: "DELETE" });
}

export async function addTransferLine(
  orderId: string,
  partId: string,
  quantity: number
): Promise<OrderSummary> {
  return apiFetch<OrderSummary>(`/service-orders/${orderId}/transfers/lines`, {
    method: "POST",
    body: JSON.stringify({ part_id: partId, quantity }),
  });
}

export async function markTransferOrdered(transferId: string): Promise<void> {
  await apiFetch(`/service-order-transfers/${transferId}/mark-ordered`, { method: "POST" });
}