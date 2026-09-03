/** Formats a numeric string with dots as thousands separators: "12345678" -> "12.345.678" */
export function formatThousands(value: string | number): string {
  const digits = String(value).replace(/\D/g, "");
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** Strips separators, returns the raw digit string. */
export function stripThousands(value: string): string {
  return value.replace(/\D/g, "");
}

/** Keeps a monetary value editable with up to two decimals, accepting comma or dot. */
export function formatMoneyInput(value: string): string {
  const normalized = value.replace(/,/g, ".").replace(/[^\d.]/g, "");
  const [integer = "", ...decimalParts] = normalized.split(".");
  const decimal = decimalParts.join("").slice(0, 2);
  return decimalParts.length ? `${integer}.${decimal}` : integer;
}

/** Formats digits as a Venezuelan phone: "04141234567" -> "(0414) 123-4567" */
export function formatVenezuelanPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 4) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 4)}) ${digits.slice(4)}`;
  return `(${digits.slice(0, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
}
