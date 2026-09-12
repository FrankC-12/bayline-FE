export type SupplierType = "fabricante" | "nacional" | "importador";
export type SupplierStatus = "activo" | "inactivo";
export type PurchaseRequestStatus = "enviada" | "cotizada" | "pagada" | "recibida" | "conciliada" | "cancelada";
export type ClaimStatus = "pendiente_envio" | "enviado" | "aprobado" | "rechazado" | "resuelto";
export type ClaimResolution = "cargo_cliente" | "costo_taller";
export type WarrantySubmissionStatus = "borrador" | "presentada" | "pagada";
export type AccountCurrency = "usd" | "bs";
export type AccountType = "corriente" | "ahorro" | "caja";
export type IncomeSource = "automatico" | "manual";
export type ExpenseCategory =
  | "nomina_comisiones"
  | "servicios"
  | "compras_proveedores"
  | "alquiler"
  | "mantenimiento"
  | "marketing"
  | "impuestos_tasas"
  | "garantia_rechazada"
  | "otro";
export type IncomeConcept =
  | "cobro_cliente"
  | "reembolso_holding"
  | "aporte_socio"
  | "venta_activo"
  | "garantia_marca"
  | "fi_intermediacion"
  | "otro_ingreso";
export type CounterpartyType = "cliente" | "proveedor" | "tercero" | "socio";
export type MovementSourceType =
  | "vehicle_sale"
  | "part_sale"
  | "service_order"
  | "supplier_claim"
  | "warranty_submission";

export interface Supplier {
  id: string;
  filial_id: string;
  business_name: string;
  trade_name: string | null;
  rif: string;
  supplier_type: SupplierType;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  status: SupplierStatus;
  created_at: string;
}

export type SupplierPaymentMethod = "transferencia" | "pago_movil" | "zelle" | "efectivo" | "otro";

export interface SupplierPaymentAccount {
  id?: string;
  payment_method: SupplierPaymentMethod;
  bank_name: string | null;
  account_holder: string;
  document: string | null;
  account_number: string | null;
  account_type: string | null;
  currency: "usd" | "bs" | "eur";
  phone: string | null;
  email: string | null;
  notes: string | null;
  is_active: boolean;
  created_at?: string;
}

export interface SupplierDetail extends Supplier {
  payment_accounts: SupplierPaymentAccount[];
  purchase_history: PurchaseRequest[];
}

export interface PurchaseRequestLine {
  id: string;
  part_id: string;
  quantity: number;
  unit_cost: number | null;
  subtotal: number | null;
}

export interface PurchaseRequest {
  id: string;
  filial_id: string;
  code: string;
  supplier_id: string;
  status: PurchaseRequestStatus;
  lines: PurchaseRequestLine[];
  total_quoted: number | null;
  created_at: string;
  updated_at: string;
}

export interface SupplierClaim {
  id: string;
  filial_id: string;
  part_id: string;
  quantity: number;
  supplier_id: string;
  status: ClaimStatus;
  return_reference: string | null;
  note: string | null;
  created_at: string;
  claimed_amount: number | null;
  currency: AccountCurrency | null;
  client_id: string | null;
  client_name: string | null;
  resolution: ClaimResolution | null;
  resolution_note: string | null;
  resolved_by_user_id: string | null;
  resolved_at: string | null;
  expense_entry_id: string | null;
  lot_id: string | null;
  purchase_request_id: string | null;
  rework_claim_id: string | null;
}

export interface SupplierClaimResolveInput {
  resolution: ClaimResolution;
  note?: string | null;
  account_id?: string | null;
  client_id?: string | null;
}

export interface WarrantySubmissionClaim {
  id: string;
  part_id: string;
  supplier_id: string;
  quantity: number;
  claimed_amount: number | null;
  currency: AccountCurrency | null;
  resolution_note: string | null;
  resolved_at: string | null;
}

export interface WarrantySubmission {
  id: string;
  filial_id: string;
  code: string;
  period_year: number;
  period_month: number;
  currency: AccountCurrency;
  status: WarrantySubmissionStatus;
  claims: WarrantySubmissionClaim[];
  total_claimed_amount: number;
  submitted_at: string | null;
  submitted_by_user_id: string | null;
  withholding_amount: number | null;
  net_amount_received: number | null;
  account_id: string | null;
  income_entry_id: string | null;
  paid_at: string | null;
  paid_by_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface WarrantySubmissionPayInput {
  account_id: string;
  withholding_amount: number;
  net_amount_received: number;
}

export interface Account {
  id: string;
  filial_id: string;
  name: string;
  bank: string | null;
  currency: AccountCurrency;
  account_type: AccountType;
  opening_balance: number;
  is_active: boolean;
  balance: number;
  balance_usd: number;
  created_at: string;
}

export interface IncomeEntry {
  id: string;
  filial_id: string;
  entry_date: string;
  source: IncomeSource;
  origin_reference: string | null;
  concept: IncomeConcept | null;
  description: string;
  amount: number;
  currency: AccountCurrency;
  account_id: string;
  counterparty_type: CounterpartyType | null;
  counterparty_client_id: string | null;
  counterparty_supplier_id: string | null;
  counterparty_name: string | null;
  reference: string | null;
  exchange_rate: number | null;
  amount_usd: number | null;
  amount_bs: number | null;
  attachment_url: string | null;
  reverses_entry_id: string | null;
  source_type: MovementSourceType | null;
  source_id: string | null;
  registered_by_user_id: string | null;
  created_at: string;
}

export interface ExpenseEntry {
  id: string;
  filial_id: string;
  entry_date: string;
  category: ExpenseCategory;
  beneficiary: string;
  description: string;
  amount: number;
  currency: AccountCurrency;
  account_id: string;
  counterparty_type: CounterpartyType | null;
  counterparty_client_id: string | null;
  counterparty_supplier_id: string | null;
  counterparty_name: string | null;
  reference: string | null;
  exchange_rate: number | null;
  amount_usd: number | null;
  amount_bs: number | null;
  attachment_url: string | null;
  reverses_entry_id: string | null;
  source_type: MovementSourceType | null;
  source_id: string | null;
  registered_by_user_id: string | null;
  created_at: string;
}

export interface AccountMovement {
  id: string;
  movement_type: "ingreso" | "egreso";
  entry_date: string;
  description: string;
  amount: number;
  currency: AccountCurrency;
  concept: IncomeConcept | null;
  category: ExpenseCategory | null;
  counterparty_type: CounterpartyType | null;
  counterparty_client_id: string | null;
  counterparty_supplier_id: string | null;
  counterparty_name: string | null;
  reference: string | null;
  attachment_url: string | null;
  reverses_entry_id: string | null;
  source_type: MovementSourceType | null;
  source_id: string | null;
  created_at: string;
}

export interface MonthTrend {
  label: string;
  income: number;
  expense: number;
}

export interface FinanceDashboard {
  income_month: number;
  expense_month: number;
  net_flow: number;
  bcv_rate: number;
  bcv_rate_is_stale: boolean;
  trend: MonthTrend[];
}

export interface ProfitabilityDepartmentRow {
  key: string;
  label: string;
  net_sales: number;
  direct_cost: number;
  gross_profit: number;
  margin: number;
}

export interface ProfitabilityAdjustmentRow {
  key: string;
  label: string;
  origin: string;
  amount: number;
}

export interface ProfitabilityReport {
  period_label: string;
  filial_id: string | null;
  date_from: string;
  date_to: string;
  bcv_rate: number;
  bcv_rate_date: string | null;
  period_is_closed: boolean;
  departments: ProfitabilityDepartmentRow[];
  net_sales_total: number;
  direct_cost_total: number;
  gross_profit_total: number;
  gross_margin: number;
  adjustments: ProfitabilityAdjustmentRow[];
  net_profit: number;
  net_margin: number;
  vehicles_sold_count: number;
  vehicles_with_estimated_cost_count: number;
  manual_movements_rate: number;
  manual_movements_count: number;
  manual_movements_total_count: number;
}
