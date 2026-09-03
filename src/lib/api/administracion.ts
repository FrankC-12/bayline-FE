import { apiFetch } from "./client";
import type {
  Account,
  ExpenseEntry,
  FinanceDashboard,
  IncomeEntry,
  ProfitabilityReport,
  PurchaseRequest,
  Supplier,
  SupplierDetail,
  SupplierPaymentAccount,
  SupplierClaim,
} from "@/types/administracion";

// Suppliers

export async function listSuppliers(filialId: string, search?: string): Promise<Supplier[]> {
  const query = new URLSearchParams({ filial_id: filialId });
  if (search) query.set("search", search);
  return apiFetch<Supplier[]>(`/suppliers?${query.toString()}`);
}

export interface CreateSupplierInput {
  filial_id: string;
  business_name: string;
  trade_name?: string | null;
  rif: string;
  supplier_type: string;
  contact_person?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  payment_accounts?: Omit<SupplierPaymentAccount, "id" | "created_at">[];
}

export async function getSupplier(id: string): Promise<SupplierDetail> {
  return apiFetch<SupplierDetail>(`/suppliers/${id}`);
}

export async function createSupplier(input: CreateSupplierInput): Promise<Supplier> {
  return apiFetch<Supplier>("/suppliers", { method: "POST", body: JSON.stringify(input) });
}

export async function updateSupplier(id: string, input: Partial<CreateSupplierInput> & { status?: string }): Promise<Supplier> {
  return apiFetch<Supplier>(`/suppliers/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

// Purchase requests

export async function listPurchaseRequests(filialId: string, search?: string): Promise<PurchaseRequest[]> {
  const query = new URLSearchParams({ filial_id: filialId });
  if (search) query.set("search", search);
  return apiFetch<PurchaseRequest[]>(`/purchase-requests?${query.toString()}`);
}

export async function getPurchaseRequest(id: string): Promise<PurchaseRequest> {
  return apiFetch<PurchaseRequest>(`/purchase-requests/${id}`);
}

export async function createPurchaseRequest(input: {
  filial_id: string;
  supplier_id: string;
  lines: { part_id: string; quantity: number }[];
}): Promise<PurchaseRequest> {
  return apiFetch<PurchaseRequest>("/purchase-requests", { method: "POST", body: JSON.stringify(input) });
}

export async function updatePurchaseRequestStatus(
  id: string,
  status: string,
  quotes?: { line_id: string; unit_cost: number }[],
  warehouseId?: string
): Promise<PurchaseRequest> {
  return apiFetch<PurchaseRequest>(`/purchase-requests/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status, quotes, warehouse_id: warehouseId }),
  });
}

// Supplier claims

export async function listSupplierClaims(filialId: string): Promise<SupplierClaim[]> {
  return apiFetch<SupplierClaim[]>(`/supplier-claims?filial_id=${filialId}`);
}

export async function createSupplierClaim(input: {
  filial_id: string;
  part_id: string;
  quantity: number;
  supplier_id: string;
  note?: string | null;
}): Promise<SupplierClaim> {
  return apiFetch<SupplierClaim>("/supplier-claims", { method: "POST", body: JSON.stringify(input) });
}

export async function updateSupplierClaim(
  id: string,
  input: { status?: string; return_reference?: string | null }
): Promise<SupplierClaim> {
  return apiFetch<SupplierClaim>(`/supplier-claims/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

// Accounts

export async function listAccounts(filialId: string): Promise<Account[]> {
  return apiFetch<Account[]>(`/accounts?filial_id=${filialId}`);
}

export async function createAccount(input: {
  filial_id: string;
  name: string;
  bank?: string | null;
  currency: string;
  account_type: string;
}): Promise<Account> {
  return apiFetch<Account>("/accounts", { method: "POST", body: JSON.stringify(input) });
}

export async function updateAccount(
  id: string,
  input: { name?: string; bank?: string | null; is_active?: boolean }
): Promise<Account> {
  return apiFetch<Account>(`/accounts/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

// Income / Expense

export async function listIncomeEntries(filialId: string, search?: string): Promise<IncomeEntry[]> {
  const query = new URLSearchParams({ filial_id: filialId });
  if (search) query.set("search", search);
  return apiFetch<IncomeEntry[]>(`/income-entries?${query.toString()}`);
}

export async function createIncomeEntry(input: {
  filial_id: string;
  entry_date: string;
  description: string;
  amount: number;
  currency: string;
  account_id: string;
}): Promise<IncomeEntry> {
  return apiFetch<IncomeEntry>("/income-entries", { method: "POST", body: JSON.stringify(input) });
}

export async function listExpenseEntries(filialId: string, search?: string): Promise<ExpenseEntry[]> {
  const query = new URLSearchParams({ filial_id: filialId });
  if (search) query.set("search", search);
  return apiFetch<ExpenseEntry[]>(`/expense-entries?${query.toString()}`);
}

export async function createExpenseEntry(input: {
  filial_id: string;
  entry_date: string;
  category: string;
  beneficiary: string;
  description: string;
  amount: number;
  currency: string;
  account_id: string;
}): Promise<ExpenseEntry> {
  return apiFetch<ExpenseEntry>("/expense-entries", { method: "POST", body: JSON.stringify(input) });
}

// Reports

export async function getFinanceDashboard(filialId: string): Promise<FinanceDashboard> {
  return apiFetch<FinanceDashboard>(`/finance/dashboard?filial_id=${filialId}`);
}

export async function getProfitability(
  filialId: string,
  dateFrom: string,
  dateTo: string
): Promise<ProfitabilityReport> {
  return apiFetch<ProfitabilityReport>(
    `/finance/profitability?filial_id=${filialId}&date_from=${dateFrom}&date_to=${dateTo}`
  );
}
