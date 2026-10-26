export interface Filial {
  legal_name?: string;
  rif?: string;
  fiscal_address?: string;
  business_type?: "concesionario" | "taller" | "mixto";
  represented_brands?: string;
  special_taxpayer?: boolean;
  invoice_series?: string;

  id: string;
  holding_id: string;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}