export type PartSaleStatus = "pendiente" | "pedido" | "completado" | "cancelado";
export type ReturnCondition = "nuevo" | "usado" | "defectuoso";
export type ReturnReason = "pedido_en_exceso" | "defectuoso" | "repuesto_incorrecto" | "otro";

export interface Part {
  id: string;
  filial_id: string;
  code: string;
  manufacturer_part_number: string | null;
  name: string;
  category_id: string;
  category_name: string;
  vehicle_brand_id: string | null;
  vehicle_brand_name: string | null;
  vehicle_model_id: string | null;
  vehicle_model_name: string | null;
  year_from: number | null;
  year_to: number | null;
  measure_id: string | null;
  measure_name: string | null;
  unit: string;
  min_stock: number;
  is_active: boolean;
  stock_total: number;
  reference_price: number | null;
  location: string | null;
  created_at: string;
  updated_at: string;
}

export interface PartCategory {
  id: string;
  holding_id: string;
  name: string;
  is_active: boolean;
}

export interface PartMeasure {
  id: string;
  holding_id: string;
  name: string;
  is_active: boolean;
}

export interface PartWarranty {
  id: string;
  part_id: string;
  lot_id: string;
  lot_code: string;
  quantity: number;
  warranty_days: number;
  starts_at: string;
  expires_at: string;
  is_active: boolean;
}

export interface PartSaleLine {
  id: string;
  part_id: string;
  quantity: number;
  unit_price: number;
  unit_cost: number | null;
  warehouse_id: string | null;
  line_total: number;
  dispatched_quantity: number | null;
  allocations: { lot_id: string; quantity: number; unit_cost: number }[];
  warranties: PartWarranty[];
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
  photo_urls: string[];
  created_at: string;
}
