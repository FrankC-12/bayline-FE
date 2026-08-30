import { apiFetch } from "./client";
import type { Holding } from "@/types/holding";

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