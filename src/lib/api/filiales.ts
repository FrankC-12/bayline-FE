import { apiFetch } from "./client";
import type { Filial } from "@/types/filial";

export interface CreateFilialInput {
  holding_id: string;
  name: string;
  slug: string;
}

export interface UpdateFilialInput {
  name?: string;
  slug?: string;
}

export async function listFiliales(holdingId?: string): Promise<Filial[]> {
  const query = holdingId ? `?holding_id=${holdingId}` : "";
  return apiFetch<Filial[]>(`/filiales${query}`);
}

export async function createFilial(input: CreateFilialInput): Promise<Filial> {
  return apiFetch<Filial>("/filiales", { method: "POST", body: JSON.stringify(input) });
}

export async function updateFilial(id: string, input: UpdateFilialInput): Promise<Filial> {
  return apiFetch<Filial>(`/filiales/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export async function setFilialActive(id: string, isActive: boolean): Promise<Filial> {
  const action = isActive ? "activate" : "deactivate";
  return apiFetch<Filial>(`/filiales/${id}/${action}`, { method: "POST" });
}