export type PartSaleStatus = "pendiente" | "pedido" | "completado" | "cancelado";
export type ReturnCondition = "nuevo" | "usado" | "defectuoso";
export type ReturnReason = "pedido_en_exceso" | "defectuoso" | "repuesto_incorrecto" | "otro";

export interface Part {
  id: string;
  filial_id: string;
  code: string;
  name: string;
  category: string;
  brand: string;
  application: string;
  unit: string;
  stock_total: number;
  reference_price: number | null;
  created_at: string;
  updated_at: string;
}

export interface PartSaleLine {
  id: string;
  part_id: string;
  quantity: number;
  unit_price: number;
}

export interface PartSale {
  id: string;
  filial_id: string;
  code: string;
  client_name: string;
  client_document: string | null;
  request_reason: string;
  discount_label: string;
  status: PartSaleStatus;
  total: number;
  lines: PartSaleLine[];
  created_at: string;
  updated_at: string;
}

export interface PartReturn {
  id: string;
  filial_id: string;
  part_id: string;
  condition: ReturnCondition;
  origin_warehouse: string;
  destination_warehouse: string;
  quantity: number;
  reason: ReturnReason;
  reason_notes: string | null;
  responsible_user_id: string;
  created_at: string;
}
