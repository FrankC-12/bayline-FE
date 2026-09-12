export interface MaintenancePlanEntry {
  id: string;
  tempario_id: string;
  tempario_code: string;
  tempario_name: string;
  interval_km: number | null;
  interval_months: number | null;
}

export interface MaintenancePlan {
  id: string;
  filial_id: string;
  brand: string;
  name: string;
  entries: MaintenancePlanEntry[];
  created_at: string;
  updated_at: string;
}

export type VehiclePlanEntryStatus = "pendiente" | "vencido" | "cumplido" | "omitido";

export interface VehiclePlanEntryStatusRead {
  entry_id: string;
  tempario_id: string;
  tempario_code: string;
  tempario_name: string;
  interval_km: number | null;
  interval_months: number | null;
  status: VehiclePlanEntryStatus;
  completed_at: string | null;
  completed_service_order_code: string | null;
}

export interface VehiclePlanStatus {
  vehicle_id: string;
  plan_id: string | null;
  plan_brand: string | null;
  plan_name: string | null;
  current_mileage: number | null;
  reference_date: string | null;
  entries: VehiclePlanEntryStatusRead[];
}
