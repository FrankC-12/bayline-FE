export const DISCOUNT_OPTIONS = [
  "Costo + 30% (Sin Descuento)",
  "Costo + 20% (Descuento 10%)",
  "Costo + 10% (Descuento 20%)",
  "Precio de costo",
] as const;

export type DiscountLabel = typeof DISCOUNT_OPTIONS[number];

export const DEFAULT_DISCOUNT: DiscountLabel = "Costo + 30% (Sin Descuento)";

/** Mirrors the backend's PARTS_MULTIPLIERS (app/modules/parts/pricing.py)
 * — the single source of truth for how a margin turns cost into a sale
 * price, everywhere in the app. */
export const PARTS_MULTIPLIERS: Record<DiscountLabel, number> = {
  "Costo + 30% (Sin Descuento)": 1.3,
  "Costo + 20% (Descuento 10%)": 1.2,
  "Costo + 10% (Descuento 20%)": 1.1,
  "Precio de costo": 1.0,
};
