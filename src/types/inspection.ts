export type InspectionStatus = "en_proceso" | "completada";

export interface Inspection {
  id: string;
  filial_id: string;
  vehicle_id: string;
  inspector_user_id: string;
  service_order_id: string | null;
  mileage: number | null;
  notes: string | null;
  status: InspectionStatus;
  created_at: string;
  updated_at: string;
}