import type { VehicleWarranty } from "@/types/vehicleWarranty";

export type WarrantyClaimType = "fabrica" | "comeback" | "repuesto_proveedor" | "campana_recall";
export type WarrantyClaimStatus = "solicitado" | "autorizado" | "rechazado" | "convertido_a_ods";

export type ReworkFailureCategory =
  | "mano_de_obra"
  | "repuesto_defectuoso"
  | "error_diagnostico"
  | "mal_uso_cliente"
  | "no_determinada";

export type WorkshopWarrantyCoverage = "mano_de_obra" | "repuesto";

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
  duration_days: number;
  duration_km: number;
  expires_at: string;
  expiration_mileage: number | null;
  status: "vigente" | "vencida";
}

export interface WarrantyClaim {
  id: string;
  code: string;
  filial_id: string;
  claim_type: WarrantyClaimType;
  vehicle_id: string;
  vehicle_plate: string | null;
  vehicle_vin: string | null;
  client_name: string;
  service_order_id: string | null;
  service_order_code: string | null;
  tempario_id: string | null;
  tempario_name: string | null;
  part_id: string | null;
  part_name: string | null;
  failure_category: ReworkFailureCategory | null;
  failure_cause: string | null;
  reported_symptom: string | null;
  reported_mileage: number;
  vehicle_mileage_at_claim: number | null;
  mileage_inconsistent: boolean;
  claimed_at: string;
  recorded_by_user_id: string | null;
  note: string | null;
  photo_urls: string[];
  document_urls: string[];
  created_at: string;
  status: WarrantyClaimStatus;
  auto_generated_supplier_claim_ids: string[];
  supplier_claim_note: string | null;
  authorized_by_user_id: string | null;
  authorized_at: string | null;
  warranty_override: boolean;
  warranty_override_note: string | null;
  converted_by_user_id: string | null;
  converted_at: string | null;
  resulting_service_order_id: string | null;
  resulting_service_order_code: string | null;
}

export interface WarrantyClaimContext {
  current_mileage: number | null;
  last_visit_date: string | null;
  last_visit_service_order_code: string | null;
  factory_warranty: VehicleWarranty | null;
  workshop_warranties: WorkshopWarranty[];
  duplicate_open_claim: WarrantyClaim | null;
}
