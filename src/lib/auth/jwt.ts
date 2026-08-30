export interface DecodedToken {
  sub: string;
  email: string;
  role_id: string;
  role_slug: string;
  scope: "platform" | "holding" | "filial";
  holding_id: string | null;
  filial_id: string | null;
  exp: number;
}

/** Decodes a JWT payload client-side. Does NOT verify the signature — the
 * backend is always the source of truth for authorization. This is only
 * used to drive UI decisions like redirects and showing the right screens. */
export function decodeJwtPayload(token: string): DecodedToken {
  const payloadBase64 = token.split(".")[1];
  const normalized = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const json = decodeURIComponent(
    atob(padded)
      .split("")
      .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
      .join("")
  );
  return JSON.parse(json) as DecodedToken;
}

export function isTokenExpired(decoded: DecodedToken): boolean {
  return Date.now() >= decoded.exp * 1000;
}