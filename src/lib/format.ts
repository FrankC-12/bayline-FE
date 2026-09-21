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

/** Formats a stored document type + number for display: ("V", "12345678") -> "V-12.345.678" */
export function formatDocumentId(documentType: string, documentNumber: string): string {
  return `${documentType}-${formatThousands(documentNumber)}`;
}

/** Keeps a monetary value editable with up to two decimals, accepting comma or dot. */
export function formatMoneyInput(value: string): string {
  const normalized = value.replace(/,/g, ".").replace(/[^\d.]/g, "");
  const [integer = "", ...decimalParts] = normalized.split(".");
  const decimal = decimalParts.join("").slice(0, 2);
  return decimalParts.length ? `${integer}.${decimal}` : integer;
}

/** Capitalizes only the first letter — safe for Spanish, unlike CSS
 * text-transform:capitalize, which title-cases every word (breaking
 * articles/prepositions like "del"/"de", e.g. "pago movil" -> "Pago movil"). */
export function capitalizeFirst(value: string): string {
  return value.length ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

/** Formats digits as a Venezuelan phone: "04141234567" -> "(0414) 123-4567" */
export function formatVenezuelanPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 4) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 4)}) ${digits.slice(4)}`;
  return `(${digits.slice(0, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
}

/** Renders a date-only "YYYY-MM-DD" value (e.g. an income/expense entry's
 * entry_date) as a calendar date, always in Venezuela's timezone rather than
 * whatever the browser happens to be set to — matching how the backend
 * computed the date in the first place. `new Date("YYYY-MM-DD")` parses as
 * UTC midnight, which a UTC-negative browser (like one in Venezuela) then
 * renders as the previous day; anchoring to noon UTC sidesteps that. */
export function formatEntryDate(dateOnly: string): string {
  return new Date(`${dateOnly}T12:00:00Z`).toLocaleDateString("es-VE", {
    timeZone: "America/Caracas",
  });
}

/** Renders a full timestamp (e.g. an entry's created_at) as date + time in
 * Venezuela's timezone, explicitly — not the browser's. */
export function formatEntryDateTime(isoTimestamp: string): string {
  return new Date(isoTimestamp).toLocaleString("es-VE", {
    timeZone: "America/Caracas",
    dateStyle: "medium",
    timeStyle: "short",
  });
}
