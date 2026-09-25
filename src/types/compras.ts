export type VehiclePurchaseOrderStatus = "enviada" | "parcialmente_recibida" | "recibida" | "conciliada" | "cancelada";

export interface VehiclePurchaseOrderLine {
  id: string;
  brand: string;
  model: string;
  version: string | null;
  year: number;
  color: string | null;
  quantity: number;
  quantity_received: number;
}

export interface VehiclePurchaseOrder {
  id: string;
  filial_id: string;
  code: string;
  supplier_id: string;
  status: VehiclePurchaseOrderStatus;
  lines: VehiclePurchaseOrderLine[];
  created_at: string;
}

export interface ReceivedUnit {
  id: string;
  purchase_order_line_id: string | null;
  vin: string;
  brand: string;
  model: string;
  year: number;
  color: string | null;
  cost_price: number | null;
  cost_is_estimated: boolean;
  purchase_order_invoice_id: string | null;
}

export interface VehicleOrderReception {
  id: string;
  received_at: string;
  notes: string | null;
  units: ReceivedUnit[];
}

export interface VehiclePurchaseOrderInvoice {
  id: string;
  invoice_number: string;
  total_amount: number;
  currency: string;
  issued_at: string;
  unit_count: number;
  created_at: string;
}

export interface VehiclePurchaseOrderDetail extends VehiclePurchaseOrder {
  receptions: VehicleOrderReception[];
  invoices: VehiclePurchaseOrderInvoice[];
}
