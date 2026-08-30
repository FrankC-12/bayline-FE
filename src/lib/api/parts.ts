import { apiFetch } from "./client";
import type { Part, PartReturn, PartSale } from "@/types/parts";

export interface CreatePartInput {
  filial_id: string;
  code: string;
  name: string;
  price: number;
  stock_quantity?: number;
  min_stock?: number;
}

export interface UpdatePartInput {
  name?: string;
  price?: number;
  stock_quantity?: number;
  min_stock?: number;
}

export async function listParts(filialId: string, search?: string): Promise<Part[]> {
  const query = new URLSearchParams({ filial_id: filialId });
  if (search) query.set("search", search);
  return apiFetch<Part[]>(`/parts?${query.toString()}`);
}

export async function createPart(input: CreatePartInput): Promise<Part> {
  return apiFetch<Part>("/parts", { method: "POST", body: JSON.stringify(input) });
}

export async function updatePart(id: string, input: UpdatePartInput): Promise<Part> {
  return apiFetch<Part>(`/parts/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export interface BulkPartItem {
  code: string;
  name: string;
  price: number;
  stock_quantity?: number;
  min_stock?: number;
}

export interface BulkPartResult {
  created: Part[];
  skipped: string[];
}

export async function bulkCreateParts(filialId: string, items: BulkPartItem[]): Promise<BulkPartResult> {
  return apiFetch<BulkPartResult>("/parts/bulk", {
    method: "POST",
    body: JSON.stringify({ filial_id: filialId, items }),
  });
}

export interface CreatePartSaleInput {
  filial_id: string;
  client_name: string;
  client_document?: string | null;
  request_reason?: string;
  discount_label?: string;
  lines: { part_id: string; quantity: number }[];
}

export async function listPartSales(filialId: string, search?: string): Promise<PartSale[]> {
  const query = new URLSearchParams({ filial_id: filialId });
  if (search) query.set("search", search);
  return apiFetch<PartSale[]>(`/part-sales?${query.toString()}`);
}

export async function createPartSale(input: CreatePartSaleInput): Promise<PartSale> {
  return apiFetch<PartSale>("/part-sales", { method: "POST", body: JSON.stringify(input) });
}

export async function updatePartSaleStatus(id: string, status: string): Promise<PartSale> {
  return apiFetch<PartSale>(`/part-sales/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
}

export interface CreatePartReturnInput {
  filial_id: string;
  part_id: string;
  condition: string;
  origin_warehouse: string;
  destination_warehouse: string;
  quantity: number;
  reason: string;
  reason_notes?: string | null;
}

export async function listPartReturns(filialId: string): Promise<PartReturn[]> {
  return apiFetch<PartReturn[]>(`/part-returns?filial_id=${filialId}`);
}

export async function createPartReturn(input: CreatePartReturnInput): Promise<PartReturn> {
  return apiFetch<PartReturn>("/part-returns", { method: "POST", body: JSON.stringify(input) });
}