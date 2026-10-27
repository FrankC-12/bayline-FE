export interface VehicleSaleDraft {
  version: 1;
  savedAt: number;
  clientId: string | null;
  advisorId: string;
  saleType: "contado" | "financiado";
  paymentMethod: "usd" | "bs" | "mixed";
  usdBaseInput: string;
  usdChannel: "" | "cash" | "binance" | "paypal" | "zelle";
  bsChannel: "" | "pago_movil" | "transferencia";
  belowCostNote: string;
}
export function vehicleSaleDraftStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
export function vehicleSaleDraftKey(
  userId: string,
  filialId: string,
  vehicleId: string,
) {
  return `bayline.vehicle-sale-draft.${userId}.${filialId}.${vehicleId}`;
}
export function readVehicleSaleDraft(
  storage: Storage | null,
  key: string,
  now = Date.now(),
): VehicleSaleDraft | null {
  try {
    const raw = storage?.getItem(key);
    if (!raw) return null;
    const draft = JSON.parse(raw);
    if (
      draft.version !== 1 ||
      typeof draft.savedAt !== "number" ||
      draft.savedAt > now ||
      now - draft.savedAt >= 86400000 ||
      !(draft.clientId === null || typeof draft.clientId === "string") ||
      typeof draft.advisorId !== "string" ||
      !["contado", "financiado"].includes(draft.saleType) ||
      !["usd", "bs", "mixed"].includes(draft.paymentMethod) ||
      typeof draft.usdBaseInput !== "string" ||
      typeof draft.belowCostNote !== "string" ||
      !["", "cash", "binance", "paypal", "zelle"].includes(draft.usdChannel) ||
      !["", "pago_movil", "transferencia"].includes(draft.bsChannel)
    ) {
      storage?.removeItem(key);
      return null;
    }
    return draft;
  } catch {
    try {
      storage?.removeItem(key);
    } catch {}
    return null;
  }
}
