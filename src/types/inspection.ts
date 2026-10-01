export type InspectionStatus = "en_proceso" | "completada";

export interface InspectionDamage {
  id: string;
  x: number;
  y: number;
  zone: string;
  kind: string;
  severity: string;
  description: string | null;
  photo_url: string | null;
}

export interface Inspection {
  id: string;
  filial_id: string;
  vehicle_id: string;
  inspector_user_id: string;
  service_order_id: string | null;
  mileage: number | null;
  notes: string | null;
  status: InspectionStatus;
  damages: InspectionDamage[];
  photo_urls: string[];
  created_at: string;
  updated_at: string;
}