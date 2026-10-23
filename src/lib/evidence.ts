/** Resolve legacy uploads through the same authenticated backend proxy as API calls. */
export function evidenceUrl(value: string): string | null {
  if (value.startsWith("/uploads/")) return `/api/v1${value}`;
  if (value.startsWith("/api/v1/")) return value;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}
export function imageEvidence(url: string, filename = ""): boolean {
  return /\.(png|jpe?g|webp|gif|avif|heic)(?:[?#]|$)/i.test(filename || url);
}
