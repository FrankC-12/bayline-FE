import { apiFetch } from "./client";
export interface TemparioQuote {
  pricing_notes?: string[];
  parts?: {
    part_id: string | null;
    name: string;
    quantity: number;
    unit_cost: number;
    subtotal: number;
  }[];
  parts_cost: number;
  parts_margin: number;
  labor_cost: number;
  total_price: number;
  iva_percentage: number;
  iva_amount: number;
  total_with_iva: number;
  hourly_rate: number;
  pricing_warnings: string[];
}
export function quoteTempario(input: {
  filial_id: string;
  estimated_hours: number;
  parts: {
    part_id: string | null;
    name: string;
    quantity: number;
    unit_cost: number;
  }[];
}) {
  return apiFetch<TemparioQuote>("/temparios/quote", {
    method: "POST",
    body: JSON.stringify(input),
    toastOnError: false,
  });
}
export function quoteOrderTempario(orderId: string, temparioId: string) {
  return apiFetch<TemparioQuote>(
    `/service-orders/${orderId}/temparios/${temparioId}/quote`,
  );
}
