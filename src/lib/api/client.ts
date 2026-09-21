const API_BASE_URL = "/api/v1";
export const AUTH_SESSION_EXPIRED_EVENT = "bayline:session-expired";
export const TOAST_EVENT = "bayline:toast";

export type ToastKind = "success" | "error" | "info";
export interface ToastEventDetail {
  kind: ToastKind;
  message: string;
}

/** Fire-and-forget — ToastProvider listens for this and renders it. Safe to
 * call with no provider mounted (e.g. in tests): the event just goes nowhere. */
export function notifyToast(kind: ToastKind, message: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ToastEventDetail>(TOAST_EVENT, { detail: { kind, message } }));
}

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

/** One entry per invalid field on a 422 — `field` is the plain field name
 * (dotted for nested, e.g. "lines.0.quantity"), already in Spanish. `field`
 * is null for a whole-payload validation error with no single field to
 * anchor to (e.g. a cross-field model validator). */
export interface ApiFieldError {
  field: string | null;
  message: string;
}

export interface ApiErrorBody {
  statusCode: number;
  errorCode: string;
  message: string;
  path: string;
  timestamp: string;
  details?: ApiFieldError[] | unknown;
}

function isFieldErrorList(details: unknown): details is ApiFieldError[] {
  return (
    Array.isArray(details) &&
    details.every((d) => d && typeof d === "object" && "field" in d && "message" in d)
  );
}

/** Mirrors the DomainError shape returned by the FastAPI backend. On a 422
 * from a Pydantic validation failure, `fieldErrors` lets a form highlight
 * the exact input that caused it instead of just showing `.message` —
 * e.g. `err.fieldErrors.find(f => f.field === "vin")?.message`. */
export class ApiError extends Error {
  statusCode: number;
  errorCode: string;
  fieldErrors: ApiFieldError[];

  constructor(body: ApiErrorBody) {
    super(body.message);
    this.statusCode = body.statusCode;
    this.errorCode = body.errorCode;
    this.fieldErrors = isFieldErrorList(body.details) ? body.details : [];
  }
}

/** Thrown when the request never got a response at all — the connection
 * timed out, or failed outright (offline, DNS, refused). There's no
 * statusCode to inspect here, unlike ApiError, which is exactly why a list
 * screen needs to check for this case separately (see classifyListError). */
export class ApiTimeoutError extends Error {
  constructor() {
    super("No se pudo conectar con el servidor. Verifica tu conexión e intenta de nuevo.");
  }
}

// Generous on purpose — this guards against a genuinely hung connection
// (dead server, dropped network), not against ordinary slow requests like a
// multipart photo upload or a PDF render, both of which go through this same
// client and can legitimately take a while.
const REQUEST_TIMEOUT_MS = 30000;

interface ApiFetchOptions extends RequestInit {
  /** Disable automatic session renewal for login/logout endpoints. */
  auth?: boolean;
  /** Suppress the automatic error toast for this call (e.g. a background
   * poll, or a form that only wants its own inline error). Defaults to
   * true for mutating requests (POST/PATCH/PUT/DELETE) and false for GET —
   * a failed read is usually already handled by the screen's own empty/error
   * state, and toasting every failed background poll would spam the user. */
  toastOnError?: boolean;
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { auth = true, headers, toastOnError, ...rest } = options;
  const method = (rest.method ?? "GET").toUpperCase();
  const shouldToast = toastOnError ?? method !== "GET";
  const finalHeaders = new Headers(headers);
  // Leave FormData bodies alone — the browser sets its own multipart
  // Content-Type with the boundary; overriding it here breaks uploads.
  if (!(rest.body instanceof FormData)) {
    finalHeaders.set("Content-Type", "application/json");
  }
  finalHeaders.set("X-CSRF-Protection", "1");
  const request = async (): Promise<Response> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      return await fetch(`${API_BASE_URL}${path}`, {
        ...rest, headers: finalHeaders, credentials: "same-origin", cache: "no-store",
        signal: controller.signal,
      });
    } catch {
      // Either the abort above (a real timeout) or fetch itself failing
      // outright (offline, DNS, connection refused) — neither has a
      // response/status to work with, unlike an ApiError.
      throw new ApiTimeoutError();
    } finally {
      clearTimeout(timer);
    }
  };
  let response: Response;
  try {
    response = await request();
    if (auth && response.status === 401) {
      await refreshSession();
      response = await request();
      if (response.status === 401) expireSession();
    }
  } catch (err) {
    if (err instanceof ApiTimeoutError && shouldToast) {
      notifyToast("error", err.message);
    }
    throw err;
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const error = new ApiError(body ?? {
      statusCode: response.status, errorCode: "unknown_error",
      message: "No se pudo completar la solicitud.", path,
      timestamp: new Date().toISOString(),
    });
    // A 401 means the session just expired — AuthContext handles that (it
    // redirects to login), a generic error toast on top would just be noise.
    if (shouldToast && response.status !== 401) notifyToast("error", error.message);
    throw error;
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
