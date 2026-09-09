const API_BASE_URL = "/api/v1";
export const AUTH_SESSION_EXPIRED_EVENT = "bayline:session-expired";

/** Remove credentials left by the previous localStorage-based release. */
export function removeLegacyTokens(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("bayline_access_token");
    localStorage.removeItem("bayline_refresh_token");
  } catch { /* Storage can be disabled; the session uses cookies exclusively. */ }
}

let refreshPromise: Promise<void> | null = null;
function expireSession(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT));
}

export async function settleSessionRefresh(): Promise<void> {
  if (refreshPromise) await refreshPromise.catch(() => undefined);
}

export async function refreshSession(): Promise<void> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST", credentials: "same-origin", cache: "no-store",
      headers: { "X-CSRF-Protection": "1" },
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) expireSession();
      throw new Error("No se pudo renovar la sesión.");
    }
  })();
  try { await refreshPromise; } finally { refreshPromise = null; }
}

export interface ApiErrorBody {
  statusCode: number;
  errorCode: string;
  message: string;
  path: string;
  timestamp: string;
  details?: unknown;
}

/** Mirrors the DomainError shape returned by the FastAPI backend. */
export class ApiError extends Error {
  statusCode: number;
  errorCode: string;

  constructor(body: ApiErrorBody) {
    super(body.message);
    this.statusCode = body.statusCode;
    this.errorCode = body.errorCode;
  }
}

interface ApiFetchOptions extends RequestInit {
  /** Disable automatic session renewal for login/logout endpoints. */
  auth?: boolean;
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { auth = true, headers, ...rest } = options;
  const finalHeaders = new Headers(headers);
  // Leave FormData bodies alone — the browser sets its own multipart
  // Content-Type with the boundary; overriding it here breaks uploads.
  if (!(rest.body instanceof FormData)) {
    finalHeaders.set("Content-Type", "application/json");
  }
  finalHeaders.set("X-CSRF-Protection", "1");
  const request = () => fetch(`${API_BASE_URL}${path}`, {
    ...rest, headers: finalHeaders, credentials: "same-origin", cache: "no-store",
  });
  let response = await request();
  if (auth && response.status === 401) {
    await refreshSession();
    response = await request();
    if (response.status === 401) expireSession();
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(body ?? {
      statusCode: response.status, errorCode: "unknown_error",
      message: "No se pudo completar la solicitud.", path,
      timestamp: new Date().toISOString(),
    });
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
