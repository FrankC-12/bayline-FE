export type ServiceOrderStatus =
  | "pendiente"
  | "en_progreso"
  | "completado"
  | "orden_cerrada"
  | "cancelado";

export type ServiceOrderType = "regular" | "mpt";

export interface ServiceOrder {
  id: string;
  filial_id: string;
  code: string;
  vehicle_id: string;
  status: ServiceOrderStatus;
  order_type: ServiceOrderType;
  technician_user_id: string | null;
  bay_id: string | null;
  notes: string | null;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  total_amount: number | null;
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
  unit_price: number;
  subtotal: number;
}

export interface ServiceOrderTransfer {
  id: string;
  code: string;
  status: TransferStatus;
  lines: TransferLine[];
  subtotal: number;
  created_at: string;
}

export interface OrderSummary {
  tasks: ServiceOrderTask[];
  transfers: ServiceOrderTransfer[];
  parts_subtotal: number;
  labor_subtotal: number;
  iva_percentage: number;
  iva_amount: number;
  total: number;
}