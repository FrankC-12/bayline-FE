import { apiFetch } from "./client";
import type { Holding } from "@/types/holding";
import type { ProfitabilityReport } from "@/types/administracion";

export interface HoldingWarrantyFilialReceivables {
  filial_id: string;
  filial_name: string;
  total_invoiced: number;
  total_pending: number;
  total_collected: number;
  total_withheld: number;
}

export interface HoldingWarrantyReceivablesReport {
  holding_id: string;
  filiales: HoldingWarrantyFilialReceivables[];
}

export async function getHoldingWarrantyReceivables(holdingId: string): Promise<HoldingWarrantyReceivablesReport> {
  return apiFetch<HoldingWarrantyReceivablesReport>(`/holdings/${holdingId}/garantias-consolidado`);
}

export async function getHoldingProfitability(
  holdingId: string,
  dateFrom: string,
  dateTo: string
): Promise<ProfitabilityReport> {
  return apiFetch<ProfitabilityReport>(
    `/holdings/${holdingId}/finance/profitability?date_from=${dateFrom}&date_to=${dateTo}`
  );
}

export interface CreateHoldingInput {
  name: string;
  slug: string;
}

export interface UpdateHoldingInput {
  name?: string;
  slug?: string;
}

export async function listHoldings(): Promise<Holding[]> {
  return apiFetch<Holding[]>("/holdings");
}

export async function createHolding(input: CreateHoldingInput): Promise<Holding> {
  return apiFetch<Holding>("/holdings", { method: "POST", body: JSON.stringify(input) });
}

export async function updateHolding(id: string, input: UpdateHoldingInput): Promise<Holding> {
  return apiFetch<Holding>(`/holdings/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export async function setHoldingActive(id: string, isActive: boolean): Promise<Holding> {
  const action = isActive ? "activate" : "deactivate";
  return apiFetch<Holding>(`/holdings/${id}/${action}`, { method: "POST" });
}