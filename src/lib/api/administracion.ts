import { apiFetch } from "./client";
import type {
  Account,
  AccountMovement,
  ExpenseEntry,
  FinanceDashboard,
  IncomeEntry,
  ProfitabilityReport,
  PurchaseRequest,
  Supplier,
  SupplierDetail,
  SupplierPaymentAccount,
  SupplierClaim,
  SupplierClaimResolveInput,
  WarrantySubmission,
  WarrantySubmissionPayInput,
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
  claimed_amount?: number | null;
  currency?: string | null;
  client_id?: string | null;
}): Promise<SupplierClaim> {
  return apiFetch<SupplierClaim>("/supplier-claims", { method: "POST", body: JSON.stringify(input) });
}

export async function updateSupplierClaim(
  id: string,
  input: {
    status?: string;
    return_reference?: string | null;
    claimed_amount?: number | null;
    currency?: string | null;
    client_id?: string | null;
  }
): Promise<SupplierClaim> {
  return apiFetch<SupplierClaim>(`/supplier-claims/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export async function resolveSupplierClaim(
  id: string,
  input: SupplierClaimResolveInput
): Promise<SupplierClaim> {
  return apiFetch<SupplierClaim>(`/supplier-claims/${id}/resolve`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// Warranty submissions (presentación mensual al holding)

export async function listWarrantySubmissions(filialId: string): Promise<WarrantySubmission[]> {
  return apiFetch<WarrantySubmission[]>(`/warranty-submissions?filial_id=${filialId}`);
}

export async function createWarrantySubmission(input: {
  filial_id: string;
  period_year: number;
  period_month: number;
  currency: string;
}): Promise<WarrantySubmission> {
  return apiFetch<WarrantySubmission>("/warranty-submissions", { method: "POST", body: JSON.stringify(input) });
}

export async function refreshWarrantySubmission(id: string): Promise<WarrantySubmission> {
  return apiFetch<WarrantySubmission>(`/warranty-submissions/${id}/refresh`, { method: "POST" });
}

export async function submitWarrantySubmission(id: string): Promise<WarrantySubmission> {
  return apiFetch<WarrantySubmission>(`/warranty-submissions/${id}/submit`, { method: "POST" });
}

export async function payWarrantySubmission(
  id: string,
  input: WarrantySubmissionPayInput
): Promise<WarrantySubmission> {
  return apiFetch<WarrantySubmission>(`/warranty-submissions/${id}/pay`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function deleteWarrantySubmission(id: string): Promise<void> {
  return apiFetch<void>(`/warranty-submissions/${id}`, { method: "DELETE" });
}

export async function downloadWarrantySubmissionCsv(id: string, code: string): Promise<void> {
  const response = await fetch(`/api/v1/warranty-submissions/${id}/export`, {
    credentials: "same-origin",
    headers: { "X-CSRF-Protection": "1" },
  });
  if (!response.ok) throw new Error("No se pudo exportar la presentación.");
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${code}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
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
  opening_balance?: number;
}): Promise<Account> {
  return apiFetch<Account>("/accounts", { method: "POST", body: JSON.stringify(input) });
}

export async function updateAccount(
  id: string,
  input: { name?: string; bank?: string | null; is_active?: boolean }
): Promise<Account> {
  return apiFetch<Account>(`/accounts/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export async function getAccount(id: string): Promise<Account> {
  return apiFetch<Account>(`/accounts/${id}`);
}

export async function getAccountMovements(id: string, limit = 50): Promise<AccountMovement[]> {
  return apiFetch<AccountMovement[]>(`/accounts/${id}/movements?limit=${limit}`);
}

// Income / Expense

export async function listIncomeEntries(filialId: string, search?: string): Promise<IncomeEntry[]> {
  const query = new URLSearchParams({ filial_id: filialId });
  if (search) query.set("search", search);
  return apiFetch<IncomeEntry[]>(`/income-entries?${query.toString()}`);
}

export interface CreateIncomeEntryInput {
  filial_id: string;
  entry_date: string;
  concept: string;
  description: string;
  amount: number;
  currency: string;
  account_id: string;
  counterparty_type: string;
  counterparty_client_id?: string | null;
  counterparty_supplier_id?: string | null;
  counterparty_name?: string | null;
  reference?: string | null;
  attachment?: File | null;
}

function toManualMovementForm(input: CreateIncomeEntryInput | CreateExpenseEntryInput): FormData {
  const { attachment, ...fields } = input;
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value !== null && value !== undefined && value !== "") form.append(key, String(value));
  }
  if (attachment instanceof File) form.append("attachment", attachment);
  return form;
}

export async function createIncomeEntry(input: CreateIncomeEntryInput): Promise<IncomeEntry> {
  return apiFetch<IncomeEntry>("/income-entries", { method: "POST", body: toManualMovementForm(input) });
}

export async function reverseIncomeEntry(id: string): Promise<IncomeEntry> {
  return apiFetch<IncomeEntry>(`/income-entries/${id}/reverse`, { method: "POST" });
}

export async function listExpenseEntries(filialId: string, search?: string): Promise<ExpenseEntry[]> {
  const query = new URLSearchParams({ filial_id: filialId });
  if (search) query.set("search", search);
  return apiFetch<ExpenseEntry[]>(`/expense-entries?${query.toString()}`);
}

export interface CreateExpenseEntryInput {
  filial_id: string;
  entry_date: string;
  category: string;
  beneficiary: string;
  description: string;
  amount: number;
  currency: string;
  account_id: string;
  counterparty_type: string;
  counterparty_client_id?: string | null;
  counterparty_supplier_id?: string | null;
  counterparty_name?: string | null;
  reference?: string | null;
  attachment?: File | null;
}

export async function createExpenseEntry(input: CreateExpenseEntryInput): Promise<ExpenseEntry> {
  return apiFetch<ExpenseEntry>("/expense-entries", { method: "POST", body: toManualMovementForm(input) });
}

export async function reverseExpenseEntry(id: string): Promise<ExpenseEntry> {
  return apiFetch<ExpenseEntry>(`/expense-entries/${id}/reverse`, { method: "POST" });
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
