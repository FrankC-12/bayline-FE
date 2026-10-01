/** Editable canonical number -> Venezuelan display, without rounding or losing trailing zeros. */
export function displayNumberInput(value: string | number): string {
  const [integer, fraction] = String(value).split(".");
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return fraction === undefined ? grouped : `${grouped},${fraction}`;
}

/** Parse localized input; pasted ungrouped decimal values are accepted too. */
export function parseNumberInput(text: string, decimals: number, allowNegative = false): string {
  let clean = text.replace(/[^\d.,-]/g, "");
  const sign = allowNegative && clean.startsWith("-") ? "-" : "";
  clean = clean.replace(/-/g, "");
  if (clean.includes(",")) {
    clean = clean.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(clean)) {
    clean = clean.replace(/\./g, "");
  }
  const [integer, ...fractions] = clean.split(".");
  const whole = integer.replace(/^0+(?=\d)/, "");
  if (!decimals) return sign + whole;
  return sign + (whole || (fractions.length ? "0" : "")) +
    (fractions.length ? `.${fractions.join("").slice(0, decimals)}` : "");
}
