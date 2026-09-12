import { apiFetch } from "./client";
import type { OrderSummary, ServiceOrder } from "@/types/serviceOrder";

export type PaymentMethod = "usd" | "bs" | "mixed";
export interface BillingInput {
  payment_method: PaymentMethod; usd_base: string;
  billed_client_id?: string | null;
  iva_retention_percentage?: number; islr_retention_percentage?: number;
}
export interface BillingContext {
  summary: OrderSummary;
  igtf_percentage: number;
  iva_retention_default_percentage: number;
  islr_retention_default_percentage: number;
  bcv_rate: number | null;
  bcv_date: string | null;
  accounts: { id: string; name: string; currency: "usd" | "bs" }[];
}
export interface BillingQuote {
  summary: OrderSummary; payment_method: PaymentMethod; billing_date: string;
  bcv_rate: number | null; bcv_date: string | null; igtf_percentage: number;
  igtf_amount: number; usd_base: number; bs_base_usd: number; due_usd: number;
  due_bs: number; total_usd: number;
  iva_retention_percentage: number; iva_retention_amount: number;
  islr_retention_percentage: number; islr_retention_amount: number; net_expected: number;
  quote_hash: string;
}
export interface Invoice extends BillingQuote {
  id: string; code: string; order_code: string; issued_at: string; filial_name: string;
  client_name: string; client_document: string; client_address: string; vehicle: string;
  payment_reference: string;
  payments: { currency: string; amount: number; account_name: string }[];
}
export interface InvoiceInput extends BillingInput {
  request_id: string; quote_hash: string; paid_usd: string; paid_bs: string;
  usd_account_id: string | null; bs_account_id: string | null; payment_reference: string;
  client_confirmed?: boolean; client_confirmed_note?: string | null;
}
export interface Receivable {
  invoice_id: string; code: string; service_order_id: string; order_code: string; filial_id: string;
  billed_client_id: string; billed_client_name: string; total_usd: number;
  iva_retention_amount: number; islr_retention_amount: number; net_expected: number;
  amount_paid_at_issuance: number; pending_amount: number; issued_at: string;
}
export interface CollectInvoicePaymentInput {
  account_id: string; withholding_amount: number; net_collected_amount: number;
}
const base = (id: string) => `/service-orders/${id}`;
export const getBillingContext = (id: string) => apiFetch<BillingContext>(`${base(id)}/billing`);
export const refreshBillingRate = (id: string) => apiFetch<BillingContext>(`${base(id)}/billing/refresh-rate`, { method: "POST" });
export const quoteBilling = (id: string, input: BillingInput) => apiFetch<BillingQuote>(`${base(id)}/billing/quote`, { method: "POST", body: JSON.stringify(input) });
export const issueInvoice = (id: string, input: InvoiceInput) => apiFetch<Invoice>(`${base(id)}/invoice`, { method: "POST", body: JSON.stringify(input) });
export const getInvoice = (id: string) => apiFetch<Invoice>(`${base(id)}/invoice`);
export const getInvoiceDocument = (id: string) => apiFetch<{filename: string; html: string}>(`${base(id)}/invoice/document`);
export const listReceivables = (filialId: string) => apiFetch<Receivable[]>(`/receivables?filial_id=${filialId}`);
export const collectReceivable = (invoiceId: string, input: CollectInvoicePaymentInput) =>
  apiFetch<Receivable>(`/receivables/${invoiceId}/collect`, { method: "POST", body: JSON.stringify(input) });
export const closeServiceOrder = (
  id: string,
  nextMaintenanceDueAt?: string | null,
  nextMaintenanceTemparioId?: string | null
) =>
  apiFetch<ServiceOrder>(`${base(id)}/close`, {
    method: "POST",
    body: JSON.stringify({
      next_maintenance_due_at: nextMaintenanceDueAt ?? null,
      next_maintenance_tempario_id: nextMaintenanceTemparioId ?? null,
    }),
  });
