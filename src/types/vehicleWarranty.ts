export type VehicleWarrantySource = "venta" | "manual";
export type VehicleWarrantyStatus = "vigente" | "vencida";
export type WorkshopWarrantyCoverage = "mano_de_obra" | "repuesto";
export type WarrantyPolicyCoveredBy = "la_casa" | "fabrica_importador" | "proveedor";

export interface WorkshopWarranty {
  id: string;
  filial_id: string;
  vin: string;
  service_order_id: string;
  service_order_task_id: string;
  coverage_type: WorkshopWarrantyCoverage;
  tempario_code_snapshot: string;
  tempario_name_snapshot: string;
  technician_user_id: string | null;
  starts_at: string;
  duration_days: number | null;
  duration_km: number | null;
  expires_at: string | null;
  expiration_mileage: number | null;
  warranty_policy_id: string | null;
  warranty_policy_name_snapshot: string | null;
  covered_by_snapshot: WarrantyPolicyCoveredBy | null;
  status: VehicleWarrantyStatus;
  days_remaining: number | null;
  created_at: string;
}

export interface VehicleWarranty {
  id: string;
  filial_id: string;
  vin: string;
  brand: string;
  model: string | null;
  starts_at: string;
  duration_months: number | null;
  duration_km: number | null;
  expires_at: string | null;
  status: VehicleWarrantyStatus;
  days_remaining: number | null;
  km_remaining: number | null;
  source: VehicleWarrantySource;
  dealership_vehicle_id: string | null;
  note: string | null;
  created_at: string;
}
