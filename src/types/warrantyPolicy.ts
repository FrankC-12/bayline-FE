export type WarrantyPolicyAppliesTo = "mano_de_obra" | "repuestos" | "ambas";
export type WarrantyPolicyCoveredBy = "la_casa" | "fabrica_importador" | "proveedor";
export type WarrantyPolicyScope = "solo_pieza" | "pieza_mas_instalacion";
export type WarrantyPolicyStatus = "activa" | "inactiva";

export interface WarrantyPolicyTemparioLink {
  id: string;
  tempario_id: string;
  tempario_code: string;
  tempario_name: string;
}

export interface WarrantyPolicyPartLink {
  id: string;
  part_id: string;
  part_code: string;
  part_name: string;
}

export interface WarrantyPolicy {
  id: string;
  filial_id: string;
  name: string;
  applies_to: WarrantyPolicyAppliesTo;
  covered_by: WarrantyPolicyCoveredBy;
  scope: WarrantyPolicyScope;
  no_expiration: boolean;
  duration_days: number | null;
  duration_km: number | null;
  status: WarrantyPolicyStatus;
  temparios: WarrantyPolicyTemparioLink[];
  parts: WarrantyPolicyPartLink[];
  created_at: string;
  updated_at: string;
}
