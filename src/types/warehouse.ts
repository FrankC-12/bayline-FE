export interface Warehouse {
  id: string;
  filial_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface PartLot {
  id: string;
  code: string;
  warehouse_id: string;
  part_id: string;
  quantity_received: number;
  quantity_remaining: number;
  unit_cost: number;
  location: string | null;
  note: string | null;
  received_at: string;
}

export type MovementType = "entrada" | "salida" | "transferencia_salida" | "transferencia_entrada" | "devolucion";
export type MovementReason = "consumo_ods" | "ajuste_inventario" | "devolucion_proveedor" | "otro";
export type TransferStatus = "pedido" | "en_proceso" | "completada" | "cancelada";

export interface StockMovement {
  id: string;
  warehouse_id: string;
  part_id: string;
  movement_type: MovementType;
  quantity: number;
  unit_cost: number | null;
  reference: string | null;
  note: string | null;
  responsible_user_id: string | null;
  created_at: string;
}

export interface TransferLine {
  id: string;
  part_id: string;
  quantity: number;
  unit_cost: number;
  subtotal: number;
}

export interface Transfer {
  id: string;
  code: string;
  origin_warehouse_id: string;
  destination_warehouse_id: string;
  status: TransferStatus;
  note: string | null;
  lines: TransferLine[];
  total_cost: number;
  created_at: string;
  completed_at: string | null;
}

export interface InventoryRow {
  part_id: string;
  part_code: string;
  part_name: string;
  warehouse_id: string;
  warehouse_name: string;
  quantity: number;
  average_cost: number | null;
  location: string | null;
  min_stock: number;
}