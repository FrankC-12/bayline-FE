import { apiFetch } from "./client";
import type {
  InventoryRow,
  PartLot,
  PartLotDetail,
  ServiceOrderPartRequest,
  StockInReason,
  StockMovement,
  Transfer,
  Warehouse,
} from "@/types/warehouse";

export async function listWarehouses(filialId: string): Promise<Warehouse[]> {
  return apiFetch<Warehouse[]>(`/warehouses?filial_id=${filialId}`);
}

export async function createWarehouse(filialId: string, name: string): Promise<Warehouse> {
  return apiFetch<Warehouse>("/warehouses", {
    method: "POST",
    body: JSON.stringify({ filial_id: filialId, name }),
  });
}

export async function listStockInReasons(
  filialId: string,
  includeInactive = false
): Promise<StockInReason[]> {
  const query = new URLSearchParams({ filial_id: filialId, include_inactive: String(includeInactive) });
  return apiFetch<StockInReason[]>(`/stock-in-reasons?${query.toString()}`);
}

export async function createStockInReason(filialId: string, name: string): Promise<StockInReason> {
  return apiFetch<StockInReason>(`/stock-in-reasons?filial_id=${filialId}`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function renameStockInReason(
  filialId: string,
  reasonId: string,
  name: string
): Promise<StockInReason> {
  return apiFetch<StockInReason>(`/stock-in-reasons/${reasonId}?filial_id=${filialId}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
}

export async function setStockInReasonActive(
  filialId: string,
  reasonId: string,
  isActive: boolean
): Promise<StockInReason> {
  const action = isActive ? "activate" : "deactivate";
  return apiFetch<StockInReason>(`/stock-in-reasons/${reasonId}/${action}?filial_id=${filialId}`, {
    method: "POST",
  });
}

export async function getInventory(
  filialId: string,
  warehouseId?: string,
  search?: string,
  partId?: string
): Promise<InventoryRow[]> {
  const query = new URLSearchParams({ filial_id: filialId });
  if (warehouseId) query.set("warehouse_id", warehouseId);
  if (search) query.set("search", search);
  if (partId) query.set("part_id", partId);
  return apiFetch<InventoryRow[]>(`/almacen/inventory?${query.toString()}`);
}

export async function listLots(
  filialId: string,
  partId?: string,
  warehouseId?: string,
  search?: string
): Promise<PartLot[]> {
  const query = new URLSearchParams({ filial_id: filialId });
  if (partId) query.set("part_id", partId);
  if (warehouseId) query.set("warehouse_id", warehouseId);
  if (search) query.set("search", search);
  return apiFetch<PartLot[]>(`/almacen/lots?${query.toString()}`);
}

export async function getLotDetail(lotId: string): Promise<PartLotDetail> {
  return apiFetch<PartLotDetail>(`/almacen/lots/${lotId}`);
}

export interface StockInLine {
  part_id: string;
  quantity: number;
  unit_cost: number;
  location?: string | null;
}

export async function createStockIn(
  filialId: string,
  warehouseId: string,
  reason: string,
  lines: StockInLine[]
): Promise<PartLot[]> {
  return apiFetch<PartLot[]>("/almacen/stock-in", {
    method: "POST",
    body: JSON.stringify({ filial_id: filialId, warehouse_id: warehouseId, reason, lines }),
  });
}

export interface BulkLotItem {
  part_code: string;
  part_name: string;
  category?: string | null;
  quantity: number;
  unit_cost: number;
  location?: string | null;
}

export interface BulkLotReviewItem extends BulkLotItem { catalog_name: string | null }
export interface BulkLotReview {
  existing: BulkLotReviewItem[];
  new: BulkLotReviewItem[];
  conflicts: BulkLotReviewItem[];
}

export async function reviewBulkLots(filialId: string, warehouseId: string, items: BulkLotItem[]): Promise<BulkLotReview> {
  return apiFetch<BulkLotReview>("/almacen/stock-in/bulk/review", { method: "POST", body: JSON.stringify({ filial_id: filialId, warehouse_id: warehouseId, items }) });
}

export interface BulkLotResult {
  created: PartLot[];
  skipped: string[];
}

export async function bulkCreateLots(
  filialId: string,
  warehouseId: string,
  items: BulkLotItem[]
): Promise<BulkLotResult> {
  return apiFetch<BulkLotResult>("/almacen/stock-in/bulk", {
    method: "POST",
    body: JSON.stringify({ filial_id: filialId, warehouse_id: warehouseId, items }),
  });
}

export async function createStockOut(input: {
  filial_id: string;
  warehouse_id: string;
  part_id: string;
  quantity: number;
  reason: string;
  reference?: string | null;
}): Promise<void> {
  await apiFetch("/almacen/stock-out", { method: "POST", body: JSON.stringify(input) });
}

export async function listTransfers(filialId: string): Promise<Transfer[]> {
  return apiFetch<Transfer[]>(`/almacen/transfers?filial_id=${filialId}`);
}

export interface TransferLineInput {
  part_id: string;
  quantity: number;
}

export async function createTransfer(input: {
  filial_id: string;
  origin_warehouse_id: string;
  destination_warehouse_id: string;
  note?: string | null;
  lines: TransferLineInput[];
}): Promise<Transfer> {
  return apiFetch<Transfer>("/almacen/transfers", { method: "POST", body: JSON.stringify(input) });
}

export async function updateTransferStatus(transferId: string, status: string): Promise<Transfer> {
  return apiFetch<Transfer>(`/almacen/transfers/${transferId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function listServiceOrderRequests(filialId: string): Promise<ServiceOrderPartRequest[]> {
  return apiFetch<ServiceOrderPartRequest[]>(`/almacen/service-order-requests?filial_id=${filialId}`);
}

export async function acknowledgeServiceOrderRequest(filialId: string, transferId: string): Promise<void> {
  await apiFetch(`/almacen/service-order-requests/${transferId}/acknowledge?filial_id=${filialId}`, {
    method: "POST",
  });
}

export async function listMovements(
  filialId: string,
  partId?: string,
  warehouseId?: string
): Promise<StockMovement[]> {
  const query = new URLSearchParams({ filial_id: filialId });
  if (partId) query.set("part_id", partId);
  if (warehouseId) query.set("warehouse_id", warehouseId);
  return apiFetch<StockMovement[]>(`/almacen/movements?${query.toString()}`);
}
