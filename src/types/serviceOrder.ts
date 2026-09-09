import type { DiscountLabel } from "@/lib/partsPricing";

export type ServiceOrderStatus =
  | "pendiente"
  | "en_progreso"
  | "completado"
  | "orden_cerrada"
  | "cancelado";

export type ServiceOrderType = "regular" | "mpt";

export interface ServiceOrder {
  discount_label: DiscountLabel;
  id: string;
  filial_id: string;
  code: string;
  vehicle_id: string;
  status: ServiceOrderStatus;
  order_type: ServiceOrderType;
  technician_user_id: string | null;
  advisor_user_id: string | null;
  bay_id: string | null;
  notes: string | null;
  scheduled_at: string | null;
  intake_mileage: number | null;
  customer_reason: string | null;
  promised_at: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  total_amount: number | null;
  invoiced_at: string | null;
}

export interface Bay {
  id: string;
  filial_id: string;
  name: string;
  is_active: boolean;
}

export type TaskStatus = "pendiente" | "completada";
export type TransferStatus = "pendiente" | "pedido";

export interface ServiceOrderTask {
  id: string;
  tempario_id: string;
  code_snapshot: string;
  name_snapshot: string;
  hours_snapshot: number;
  status: TaskStatus;
  created_at: string;
}

export interface TransferLine {
  id: string;
  part_id: string;
  quantity: number;
  unit_price: number | null;
  subtotal: number | null;
}

export interface ServiceOrderTransfer {
  id: string;
  code: string;
  status: TransferStatus;
  lines: TransferLine[];
  subtotal: number | null;
  created_at: string;
}

export interface OrderSummary {
  igtf_percentage: number;
  igtf_amount: number;
  pricing_frozen: boolean;
  pricing_snapshot_available: boolean;
  discount_label: DiscountLabel;
  tasks: ServiceOrderTask[];
  transfers: ServiceOrderTransfer[];
  parts_subtotal: number | null;
  labor_subtotal: number | null;
  iva_percentage: number | null;
  iva_amount: number | null;
  total: number;
}