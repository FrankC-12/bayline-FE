import { apiFetch } from "./client";
import type { VehiclePurchaseOrder, VehiclePurchaseOrderDetail } from "@/types/compras";

// Vehicle purchase orders (OC de vehículos)

export interface VehiclePurchaseOrderLineInput {
  brand: string;
  model: string;
  version?: string | null;
  year: number;
  color?: string | null;
  quantity: number;
}

export interface CreateVehiclePurchaseOrderInput {
  filial_id: string;
  supplier_id: string;
  lines: VehiclePurchaseOrderLineInput[];
}

export async function listVehiclePurchaseOrders(filialId: string): Promise<VehiclePurchaseOrder[]> {
  const query = new URLSearchParams({ filial_id: filialId });
  return apiFetch<VehiclePurchaseOrder[]>(`/compras/vehicle-orders?${query.toString()}`);
}

export async function createVehiclePurchaseOrder(
  input: CreateVehiclePurchaseOrderInput
): Promise<VehiclePurchaseOrder> {
  return apiFetch<VehiclePurchaseOrder>("/compras/vehicle-orders", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getVehiclePurchaseOrder(id: string): Promise<VehiclePurchaseOrderDetail> {
  return apiFetch<VehiclePurchaseOrderDetail>(`/compras/vehicle-orders/${id}`);
}

export interface ReceptionUnitInput {
  purchase_order_line_id: string;
  vin: string;
}

export interface AddReceptionInput {
  notes?: string | null;
  units: ReceptionUnitInput[];
}

export async function addVehicleOrderReception(
  orderId: string,
  input: AddReceptionInput
): Promise<VehiclePurchaseOrderDetail> {
  return apiFetch<VehiclePurchaseOrderDetail>(`/compras/vehicle-orders/${orderId}/receptions`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export interface AddInvoiceInput {
  invoice_number: string;
  total_amount: number;
  currency?: string;
  issued_at: string;
  dealership_vehicle_ids?: string[] | null;
}

export async function addVehicleOrderInvoice(
  orderId: string,
  input: AddInvoiceInput
): Promise<VehiclePurchaseOrderDetail> {
  return apiFetch<VehiclePurchaseOrderDetail>(`/compras/vehicle-orders/${orderId}/invoices`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function cancelVehiclePurchaseOrder(orderId: string): Promise<VehiclePurchaseOrder> {
  return apiFetch<VehiclePurchaseOrder>(`/compras/vehicle-orders/${orderId}/cancel`, {
    method: "POST",
  });
}
