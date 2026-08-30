export type UpsellStatus = "pendiente" | "aprobado" | "pospuesto" | "rechazado";

export interface Upsell {
  id: string;
  service_order_id: string;
  title: string;
  description: string;
  detected_by_user_id: string | null;
  evidence_count: number;
  status: UpsellStatus;
  created_at: string;
  resolved_at: string | null;
}