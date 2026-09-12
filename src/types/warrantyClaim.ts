export type WarrantyClaimStatus = "solicitado";

export interface WarrantyClaim {
  id: string;
  filial_id: string;
  vehicle_id: string;
  vehicle_plate: string;
  vehicle_vin: string | null;
  client_name: string;
  reported_symptom: string;
  reported_mileage: number;
  vehicle_mileage_at_claim: number | null;
  mileage_inconsistent: boolean;
  status: WarrantyClaimStatus;
  warranty_ids: string[];
  recorded_by_user_id: string | null;
  created_at: string;
}
