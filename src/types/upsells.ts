export type UpsellStatus = "pendiente" | "aprobado" | "pospuesto" | "rechazado";
export type UpsellApprovalChannel = "whatsapp" | "llamada" | "correo" | "sms" | "presencial";

export interface UpsellTask {
  id: string;
  tempario_id: string;
  code_snapshot: string;
  name_snapshot: string;
  hours_snapshot: number;
}

export interface UpsellPart {
  id: string;
  part_id: string;
  name_snapshot: string;
  quantity: number;
  unit_cost_snapshot: number;
  line_total: number;
}

export interface Upsell {
  id: string;
  service_order_id: string;
  title: string;
  description: string;
  detected_by_user_id: string | null;
  evidence_count: number;
  status: UpsellStatus;
  tasks: UpsellTask[];
  parts: UpsellPart[];
  amount: number;
  approved_by_user_id: string | null;
  approval_channel: UpsellApprovalChannel | null;
  created_at: string;
  resolved_at: string | null;
}
