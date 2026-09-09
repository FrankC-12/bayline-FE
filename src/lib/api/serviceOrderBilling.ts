import { apiFetch } from "./client";
import type { OrderSummary, ServiceOrder } from "@/types/serviceOrder";

export type PaymentMethod = "usd" | "bs" | "mixed";
export interface BillingInput { payment_method: PaymentMethod; usd_base: string }
export interface BillingContext {
  summary: OrderSummary;
  igtf_percentage: number;
  bcv_rate: number | null;
  bcv_date: string | null;
  accounts: { id: string; name: string; currency: "usd" | "bs" }[];
}
export interface BillingQuote {
  summary: OrderSummary; payment_method: PaymentMethod; billing_date: string;
  bcv_rate: number | null; bcv_date: string | null; igtf_percentage: number;
  igtf_amount: number; usd_base: number; bs_base_usd: number; due_usd: number;
  due_bs: number; total_usd: number; quote_hash: string;
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
}
const base = (id: string) => `/service-orders/${id}`;
export const getBillingContext = (id: string) => apiFetch<BillingContext>(`${base(id)}/billing`);
export const refreshBillingRate = (id: string) => apiFetch<BillingContext>(`${base(id)}/billing/refresh-rate`, { method: "POST" });
export const quoteBilling = (id: string, input: BillingInput) => apiFetch<BillingQuote>(`${base(id)}/billing/quote`, { method: "POST", body: JSON.stringify(input) });
export const issueInvoice = (id: string, input: InvoiceInput) => apiFetch<Invoice>(`${base(id)}/invoice`, { method: "POST", body: JSON.stringify(input) });
export const getInvoice = (id: string) => apiFetch<Invoice>(`${base(id)}/invoice`);
export const getInvoiceDocument = (id: string) => apiFetch<{filename: string; html: string}>(`${base(id)}/invoice/document`);
export const closeServiceOrder = (id: string) => apiFetch<ServiceOrder>(`${base(id)}/close`, { method: "POST" });
