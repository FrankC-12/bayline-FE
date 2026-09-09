export const DISCOUNT_OPTIONS = [
  "Costo + 30% (Sin Descuento)",
  "Costo + 20% (Descuento 10%)",
  "Costo + 10% (Descuento 20%)",
  "Precio de costo",
] as const;

export type DiscountLabel = typeof DISCOUNT_OPTIONS[number];
