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
  cancel_reason: string | null;
  cancelled_by_user_id: string | null;
  cancelled_at: string | null;
  reopened_by_user_id: string | null;
  reopened_at: string | null;
  completed_with_pending_items: boolean;
  completed_override_by_user_id: string | null;
  completed_override_at: string | null;
}

export interface Bay {
  id: string;
  filial_id: string;
  name: string;
  is_active: boolean;
}

export type TaskStatus = "pendiente" | "completada";
export type TransferStatus = "pendiente" | "pedido";
export type ServiceOrderPayer =
  | "cliente"
  | "garantia_taller"
  | "garantia_fabrica"
  | "plan_mantenimiento"
  | "proveedor";

export interface ServiceOrderTask {
  id: string;
  tempario_id: string;
  code_snapshot: string;
  name_snapshot: string;
  hours_snapshot: number;
  status: TaskStatus;
  payer: ServiceOrderPayer;
  created_at: string;
}

export interface TransferLine {
  id: string;
  part_id: string;
  quantity: number;
  unit_price: number | null;
  subtotal: number | null;
  payer: ServiceOrderPayer;
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
  payer_breakdown?: { payer: ServiceOrderPayer; labor_subtotal: number; parts_subtotal: number; subtotal: number }[] | null;
  igtf_percentage: number;
  igtf_amount: number;
  pricing_frozen: boolean;
  pricing_snapshot_available: boolean;
  discount_label: DiscountLabel;
  tasks: ServiceOrderTask[];
  transfers: ServiceOrderTransfer[];
  parts_subtotal: number | null;
  labor_subtotal: number | null;
  non_client_subtotal: number;
  iva_percentage: number | null;
  iva_amount: number | null;
  total: number;
  // Non-blocking, one-off hints from whatever action just returned this
  // summary (e.g. "added the part anyway, but stock is short") — empty on
  // any summary fetched afterward that isn't a direct result of that action.
  warnings: string[];
}