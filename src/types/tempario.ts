export type TemparioCategory =
  | "mantenimiento_preventivo"
  | "frenos"
  | "suspension"
  | "transmision"
  | "neumaticos"
  | "motor"
  | "electrico"
  | "aire_acondicionado"
  | "otro";

export interface CompatibleVehicle {
  brand: string;
  model: string;
}

export interface TemparioPart {
  id: string;
  part_id: string | null;
  name: string;
  quantity: number;
  unit_cost: number;
  subtotal: number;
}

export interface Tempario {
  id: string;
  filial_id: string;
  code: string;
  category: TemparioCategory;
  name: string;
  estimated_hours: number;
  year_from: number | null;
  year_to: number | null;
  compatible_vehicles: CompatibleVehicle[];
  tools: string[];
  requires_parts: boolean;
  parts: TemparioPart[];
  parts_cost: number;
  parts_margin: number;
  labor_cost: number;
  total_price: number;
  created_at: string;
  updated_at: string;
}

export interface LaborSettings {
  filial_id: string;
  hourly_rate: number;
  commission_percentage: number;
  igtf_percentage: number;
  iva_percentage: number;
  bcv_rate: number;
  updated_at: string;
}