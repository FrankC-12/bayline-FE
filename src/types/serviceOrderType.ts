import type { WarrantyClaimType } from "./warrantyClaim";

export interface ServiceOrderTypeCatalog {
  id: string;
  filial_id: string;
  code: string;
  name: string;
  description: string | null;
  is_system: boolean;
  // Only ever set on the 6 system rows seeded per filial (garantia_fabrica/
  // comeback/campana) — an admin-created type never carries one, so it
  // behaves like "regular" (no warranty claim required to pick it).
  claim_type: WarrantyClaimType | null;
  // False only for mpt (unused, reserved) and retrabajo (auto-assigned only
  // when converting a warranty claim) — hidden from the manual "tipo de
  // orden" picker when creating an ODS.
  is_selectable: boolean;
  is_active: boolean;
}
