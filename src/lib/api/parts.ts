import { apiFetch } from "./client";
import type { Part, PartCategory, PartMeasure, PartReturn, PartSale } from "@/types/parts";

export interface CreatePartInput {
  filial_id: string;
  code: string;
  manufacturer_part_number?: string | null;
  name: string;
  category_id: string;
  vehicle_brand_id?: string | null;
  vehicle_model_id?: string | null;
  year_from?: number | null;
  year_to?: number | null;
  measure_id?: string | null;
  unit: string;
  min_stock?: number;
}

export interface UpdatePartInput {
  code?: string;
  manufacturer_part_number?: string | null;
  name?: string;
  category_id?: string;
  vehicle_brand_id?: string | null;
  vehicle_model_id?: string | null;
  year_from?: number | null;
  year_to?: number | null;
  measure_id?: string | null;
  unit?: string;
  min_stock?: number;
  clear_vehicle_brand?: boolean;
  clear_vehicle_model?: boolean;
  clear_measure?: boolean;
  clear_manufacturer_part_number?: boolean;
  clear_years?: boolean;
}

export async function listParts(
  filialId: string,
  search?: string,
  includeInactive = false
): Promise<Part[]> {
  const query = new URLSearchParams({ filial_id: filialId, include_inactive: String(includeInactive) });
  if (search) query.set("search", search);
  return apiFetch<Part[]>(`/parts?${query.toString()}`);
}

export async function createPart(input: CreatePartInput): Promise<Part> {
  return apiFetch<Part>("/parts", { method: "POST", body: JSON.stringify(input) });
}

export async function updatePart(id: string, input: UpdatePartInput): Promise<Part> {
  return apiFetch<Part>(`/parts/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export async function setPartActive(id: string, isActive: boolean): Promise<Part> {
  const action = isActive ? "activate" : "deactivate";
  return apiFetch<Part>(`/parts/${id}/${action}`, { method: "POST" });
}

export async function listPartCategories(
  filialId: string,
  includeInactive = false
): Promise<PartCategory[]> {
  const query = new URLSearchParams({ filial_id: filialId, include_inactive: String(includeInactive) });
  return apiFetch<PartCategory[]>(`/part-categories?${query.toString()}`);
}

export async function createPartCategory(filialId: string, name: string): Promise<PartCategory> {
  return apiFetch<PartCategory>(`/part-categories?filial_id=${filialId}`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function renamePartCategory(
  filialId: string,
  categoryId: string,
  name: string
): Promise<PartCategory> {
  return apiFetch<PartCategory>(`/part-categories/${categoryId}?filial_id=${filialId}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
}

export async function setPartCategoryActive(
  filialId: string,
  categoryId: string,
  isActive: boolean
): Promise<PartCategory> {
  const action = isActive ? "activate" : "deactivate";
  return apiFetch<PartCategory>(`/part-categories/${categoryId}/${action}?filial_id=${filialId}`, {
    method: "POST",
  });
}

export async function listPartMeasures(
  filialId: string,
  includeInactive = false
): Promise<PartMeasure[]> {
  const query = new URLSearchParams({ filial_id: filialId, include_inactive: String(includeInactive) });
  return apiFetch<PartMeasure[]>(`/part-measures?${query.toString()}`);
}

export async function createPartMeasure(filialId: string, name: string): Promise<PartMeasure> {
  return apiFetch<PartMeasure>(`/part-measures?filial_id=${filialId}`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function renamePartMeasure(
  filialId: string,
  measureId: string,
  name: string
): Promise<PartMeasure> {
  return apiFetch<PartMeasure>(`/part-measures/${measureId}?filial_id=${filialId}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
}

export async function setPartMeasureActive(
  filialId: string,
  measureId: string,
  isActive: boolean
): Promise<PartMeasure> {
  const action = isActive ? "activate" : "deactivate";
  return apiFetch<PartMeasure>(`/part-measures/${measureId}/${action}?filial_id=${filialId}`, {
    method: "POST",
  });
}

export interface BulkPartItem {
  code: string;
  name: string;
  category: string;
  unit: string;
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
  warehouse_id: string;
  client_name: string;
  client_document?: string | null;
  discount_label?: string;
  lines: { part_id: string; quantity: number }[];
}

export async function listPartSales(filialId: string, search?: string): Promise<PartSale[]> {
  const query = new URLSearchParams({ filial_id: filialId });
  if (search) query.set("search", search);
  return apiFetch<PartSale[]>(`/part-sales?${query.toString()}`);
}

export async function getPartSale(id: string): Promise<PartSale> {
  return apiFetch<PartSale>(`/part-sales/${id}`);
}

export async function createPartSale(input: CreatePartSaleInput): Promise<PartSale> {
  return apiFetch<PartSale>("/part-sales", { method: "POST", body: JSON.stringify(input) });
}

export interface DispatchLineInput {
  line_id: string;
  dispatched_quantity: number;
}

export async function updatePartSaleStatus(
  id: string,
  status: string,
  dispatchedLines?: DispatchLineInput[]
): Promise<PartSale> {
  return apiFetch<PartSale>(`/part-sales/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      status,
      ...(dispatchedLines ? { dispatched_lines: dispatchedLines } : {}),
    }),
  });
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
  photos: File[];
}

export async function listPartReturns(filialId: string): Promise<PartReturn[]> {
  return apiFetch<PartReturn[]>(`/part-returns?filial_id=${filialId}`);
}

export async function createPartReturn(input: CreatePartReturnInput): Promise<PartReturn> {
  const { photos, ...fields } = input;
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value !== null && value !== undefined) form.append(key, String(value));
  }
  for (const photo of photos) form.append("photos", photo);
  return apiFetch<PartReturn>("/part-returns", { method: "POST", body: form });
}

export interface PartSaleQuote {
  total: number;
  lines: { part_id: string; warehouse_id: string; quantity: number; unit_price: number;
    unit_cost: number; line_total: number;
    allocations: { lot_id: string; quantity: number; unit_cost: number }[] }[];
}

export async function quotePartSale(input: Omit<CreatePartSaleInput, "client_name" | "client_document">) {
  return apiFetch<PartSaleQuote>("/part-sales/quote", {
    method: "POST", body: JSON.stringify(input),
  });
}
