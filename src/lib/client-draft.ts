import type { Client } from "@/types/client";
import type { VehicleFormValue } from "@/types/client-form";

export interface ClientDraft {
  fullName: string; clientType: "particular" | "empresa"; documentType: "V" | "J" | "E" | "G";
  documentNumber: string; email: string; phonePrimary: string; phoneSecondary: string;
  contactPreference: string; address: string; addressType: string;
  isHoldingBilling: boolean; vehicles: VehicleFormValue[];
}
export interface SavedClientDraft { version: 1; savedAt: number; baseVersion: string | null; data: ClientDraft }
const PAUSED = "bayline.client-drafts-paused";
export function getDraftStorage(): Storage | null { try { return window.sessionStorage; } catch { return null; } }
export function resumeClientDrafts(storage: Storage | null) { try { storage?.removeItem(PAUSED); } catch {} }
export const DRAFT_PREFIX = "bayline.client-draft.";
export function draftKey(userId: string, filialId: string, clientId?: string) {
  return `${DRAFT_PREFIX}${userId}.${filialId}.${clientId ?? "new"}`;
}
export function initialClientDraft(client: Client | null): ClientDraft {
  return {
    fullName: client?.full_name ?? "", clientType: client?.client_type ?? "particular",
    documentType: client?.document_type ?? "V", documentNumber: client?.document_number ?? "",
    email: client?.email ?? "", phonePrimary: client?.phone_primary ?? "", phoneSecondary: client?.phone_secondary ?? "",
    contactPreference: client?.contact_preference ?? "", address: client?.address ?? "",
    addressType: client?.address_type ?? "hogar", isHoldingBilling: client?.is_holding_billing ?? false,
    vehicles: client?.vehicles.map((v) => ({id: v.id, brand: v.brand, model: v.model, year: v.year?.toString() ?? "",
      vin: v.vin ?? "", mileage: v.mileage?.toString() ?? "", purchaseDate: v.purchase_date ?? "", bodyType: v.body_type ?? "",
      plate: v.plate ?? "", noPlate: !v.plate, originalPlate: v.plate ?? "", color: v.color ?? "",
      upholstery: v.upholstery ?? "", fuelType: v.fuel_type ?? "", transmission: v.transmission ?? "",
      currentMileage: v.current_mileage, currentMileageVisitDate: v.current_mileage_visit_date,
      currentMileageServiceOrderId: v.current_mileage_service_order_id, currentMileageServiceOrderCode: v.current_mileage_service_order_code})) ?? [],
  };
}
export function readClientDraft(storage: Storage | null, key: string, now = Date.now()): SavedClientDraft | null {
  try {
    if (!storage) return null;
    const raw = storage.getItem(key); if (!raw) return null;
    const saved = JSON.parse(raw);
    const data = saved?.data;
    const initial = initialClientDraft(null);
    const valid = saved.version === 1 && typeof saved.savedAt === "number" && now >= saved.savedAt
      && now - saved.savedAt < 86400000 && (saved.baseVersion === null || typeof saved.baseVersion === "string")
      && data && Object.entries(initial).every(([field, value]) => field === "vehicles"
        ? Array.isArray(data.vehicles) && data.vehicles.every((v: VehicleFormValue) => v && ["brand", "model", "plate", "vin", "year", "mileage", "bodyType", "purchaseDate", "color", "upholstery", "fuelType", "transmission"].every((name) => typeof (v as unknown as Record<string, unknown>)[name] === "string") && typeof v.noPlate === "boolean" && (v.originalPlate === undefined || typeof v.originalPlate === "string"))
        : typeof data[field] === typeof value)
      && ["particular", "empresa"].includes(data.clientType) && ["V", "J", "E", "G"].includes(data.documentType);
    if (!valid) { storage.removeItem(key); return null; }
    return saved;
  } catch { return null; }
}
export function writeClientDraft(storage: Storage | null, key: string, data: ClientDraft, baseVersion: string | null): boolean {
  try { if (!storage || storage.getItem(PAUSED)) return false; storage.setItem(key, JSON.stringify({version: 1, savedAt: Date.now(), baseVersion, data})); return true; }
  catch { return false; }
}
export function clearClientDrafts(storage: Storage | null) {
  try { if (!storage) return; storage.setItem(PAUSED, "1"); for (let i = storage.length - 1; i >= 0; i--) { const key = storage.key(i); if (key?.startsWith(DRAFT_PREFIX)) storage.removeItem(key); } }
  catch { /* Storage can be disabled by browser policy. */ }
}
