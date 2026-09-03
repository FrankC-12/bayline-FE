export type SupplierType = "fabricante" | "nacional" | "importador";
export type SupplierStatus = "activo" | "inactivo";
export type PurchaseRequestStatus = "enviada" | "cotizada" | "pagada" | "recibida" | "conciliada" | "cancelada";
export type ClaimStatus = "pendiente_envio" | "enviado" | "aprobado" | "rechazado" | "resuelto";
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
  | "otro";

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
}

export interface Account {
  id: string;
  filial_id: string;
  name: string;
  bank: string | null;
  currency: AccountCurrency;
  account_type: AccountType;
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
  description: string;
  amount: number;
  currency: AccountCurrency;
  account_id: string;
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
  registered_by_user_id: string | null;
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
  trend: MonthTrend[];
}

export interface ProfitabilityReport {
  period_label: string;
  total_income: number;
  parts_cost: number;
  vehicles_cost: number;
  gross_profit: number;
  operating_expenses: number;
  commissions_paid: number;
  shrinkage_losses: number;
  net_profit: number;
}
