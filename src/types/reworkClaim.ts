export type ReworkFailureCategory =
  | "mano_de_obra"
  | "repuesto_defectuoso"
  | "error_diagnostico"
  | "mal_uso_cliente"
  | "no_determinada";

export type ReworkClaimStatus = "abierto" | "cerrado";
export type ReworkAuthorizationStatus = "pendiente" | "aprobado" | "rechazado";

export interface ReworkClaim {
  id: string;
  service_order_id: string;
  tempario_id: string | null;
  tempario_name: string | null;
  part_id: string | null;
  part_name: string | null;
  failure_category: ReworkFailureCategory | null;
  failure_cause: string;
  claimed_at: string;
  days_since_invoice: number | null;
  recorded_by_user_id: string | null;
  note: string | null;
  created_at: string;
  status: ReworkClaimStatus;
  closed_at: string | null;
  closed_by_user_id: string | null;
  auto_generated_supplier_claim_ids: string[];
  supplier_claim_note: string | null;
  authorization_status: ReworkAuthorizationStatus;
  authorized_by_user_id: string | null;
  authorized_at: string | null;
  warranty_override: boolean;
  warranty_override_note: string | null;
  resulting_service_order_id: string | null;
  resulting_service_order_code: string | null;
}
