import type { WarrantyClaim } from "@/types/warrantyClaim";
type Terms = {
  kind?: string;
  starts_at?: string | null;
  expires_at?: string | null;
  duration_km?: number | null;
  expiration_mileage?: number | null;
  start_mileage?: number | null;
};
export function assessClaimCoverage(
  terms: Terms,
  mileage: number | null,
  today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Caracas",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date()),
): NonNullable<WarrantyClaim["warranty_assessment"]> {
  if (terms.kind === "campaign")
    return { applicable: false, valid: null, time: null, distance: null };
  const day = (value: string) =>
    Date.parse(value.slice(0, 10) + "T00:00:00Z") / 86400000;
  const start = terms.starts_at ? day(terms.starts_at) : null,
    end = terms.expires_at ? day(terms.expires_at) : null,
    now = day(today);
  const time =
    start !== null && end !== null
      ? {
          used: Math.max(0, now - start),
          limit: Math.max(0, end - start),
          expires_at: terms.expires_at!,
          valid: now >= start && now <= end,
        }
      : null;
  const limit = terms.duration_km,
    base =
      terms.start_mileage ??
      (terms.expiration_mileage != null && limit != null
        ? terms.expiration_mileage - limit
        : terms.kind === "factory"
          ? 0
          : null);
  const distance =
    limit != null && base !== null && mileage !== null
      ? {
          used: Math.max(0, mileage - base),
          limit,
          start_mileage: base,
          expiration_mileage: terms.expiration_mileage ?? base + limit,
          valid: mileage >= base && mileage < base + limit,
        }
      : null;
  let valid: boolean | null =
    (start === null || now >= start) &&
    (!time || time.valid) &&
    (!distance || distance.valid);
  if (valid && limit != null && !distance) valid = null;
  return { applicable: true, valid, time, distance };
}
