import type { ServiceOrderType } from "@/types/serviceOrder";
import type { WarrantyClaimType } from "@/types/warrantyClaim";

/** order_type values an advisor picks by hand that require linking an
 * existing, autorizado WarrantyClaim of the matching claim_type for the same
 * vehicle — see ServiceOrderService.create_order. Distinct from "retrabajo",
 * which is only ever set automatically by "Convertir a ODS" on the Reclamos
 * screen. */
export const CLAIM_LINKED_ORDER_TYPES: Partial<Record<ServiceOrderType, WarrantyClaimType>> = {
  garantia_fabrica: "fabrica",
  comeback: "comeback",
  campana: "campana_recall",
};

export const CLAIM_LINKED_ORDER_TYPE_LABELS: Record<string, string> = {
  garantia_fabrica: "Garantía de fábrica",
  comeback: "Trabajo previo (comeback)",
  campana: "Campaña",
};

export function isClaimLinkedOrderType(orderType: ServiceOrderType): boolean {
  return orderType in CLAIM_LINKED_ORDER_TYPES;
}
