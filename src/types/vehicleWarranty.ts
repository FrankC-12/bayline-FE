export type VehicleWarrantySource = "venta" | "manual";
export type VehicleWarrantyStatus = "vigente" | "vencida";

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
