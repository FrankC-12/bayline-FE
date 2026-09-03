export type VehicleCondition = "nuevo" | "usado";
export type VehicleStatus = "en_transito" | "disponible" | "en_preparacion" | "reservado" | "vendido";
export type FuelType = "gasolina" | "diesel" | "hibrido" | "electrico";
export type TransmissionType = "automatica" | "manual";
export type SaleType = "contado" | "financiado";

export interface DealershipVehicle {
  id: string;
  filial_id: string;
  status: VehicleStatus;
  condition: VehicleCondition;
  brand: string;
  model: string;
  year: number;
  color: string | null;
  fuel_type: FuelType | null;
  transmission: TransmissionType | null;
  vin: string;
  plate: string | null;
  sku: string;
  price_cash: number;
  price_financed: number;
  cost_price: number | null;
  price_currency: "USD" | "VES";
  iva_percentage: number;
  igtf_percentage: number;
  luxury_tax_percentage: number;
  iva_amount: number;
  igtf_amount: number;
  luxury_tax_amount: number;
  cash_total: number;
  financing_provider: string | null;
  financing_external_id: string | null;
  images: string[];
  created_at: string;
  updated_at: string;
}

export interface VehicleSale {
  id: string;
  code: string;
  vehicle_id: string;
  client_name: string;
  client_document: string | null;
  advisor_user_id: string | null;
  sale_type: SaleType;
  final_price: number;
  created_at: string;
}
