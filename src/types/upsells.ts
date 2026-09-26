export type UpsellStatus = "pendiente" | "aprobado" | "pospuesto" | "rechazado";
export type UpsellApprovalChannel = "whatsapp" | "llamada" | "correo" | "sms" | "presencial";
export type UpsellSeverity = "urgente" | "pronto" | "monitorear";
export type UpsellDiscardReason = "ya_reparado_otro_taller" | "cliente_no_lo_quiere" | "ya_no_aplica" | "otro";

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
  severity: UpsellSeverity;
  detected_mileage: number | null;
  photo_urls: string[];
  status: UpsellStatus;
  tasks: UpsellTask[];
  parts: UpsellPart[];
  amount: number;
  approved_by_user_id: string | null;
  approval_channel: UpsellApprovalChannel | null;
  applied_to_service_order_id: string | null;
  discard_reason: UpsellDiscardReason | null;
  discard_note: string | null;
  created_at: string;
  resolved_at: string | null;
}

/** An Upsell plus which ODS it originated from — only returned by the
 * "recomendaciones pendientes de este vehículo" endpoint, since that list
 * spans multiple orders. */
export interface PendingUpsell extends Upsell {
  origin_service_order_code: string;
}
