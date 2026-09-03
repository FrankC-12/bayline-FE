const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
const ACCESS_TOKEN_STORAGE_KEY = "bayline_access_token";
const REFRESH_TOKEN_STORAGE_KEY = "bayline_refresh_token";

export const AUTH_SESSION_EXPIRED_EVENT = "bayline:session-expired";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
}

interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
}

let refreshPromise: Promise<string> | null = null;

function expireSession(): void {
  clearToken();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT));
  }
}

/** Refreshes the token pair. Concurrent callers share the same request. */
export async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) throw new Error("No refresh token available.");

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) throw new Error("The session could not be renewed.");

    const tokens = (await response.json()) as RefreshTokenResponse;
    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error("The refresh response did not contain a token pair.");
    }

    setTokens(tokens.access_token, tokens.refresh_token);
    return tokens.access_token;
  })();

  try {
    return await refreshPromise;
  } catch (error) {
    expireSession();
    throw error;
  } finally {
    refreshPromise = null;
  }
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
  /** Set to false for endpoints that don't require a Bearer token (e.g. login). Defaults to true. */
  auth?: boolean;
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { auth = true, headers, ...rest } = options;

  const request = (token: string | null) => {
    const finalHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...(headers as Record<string, string>),
    };
    if (auth && token) finalHeaders.Authorization = `Bearer ${token}`;
    return fetch(`${API_BASE_URL}${path}`, { ...rest, headers: finalHeaders });
  };

  let response = await request(auth ? getToken() : null);
  let retriedAfterRefresh = false;

  // Retry exactly once. refreshAccessToken deduplicates simultaneous 401 responses.
  if (auth && response.status === 401) {
    const accessToken = await refreshAccessToken();
    response = await request(accessToken);
    retriedAfterRefresh = true;
  }

  // A freshly issued token should be accepted. If it is not, the session is no
  // longer usable (for example, the user was disabled between both requests).
  if (retriedAfterRefresh && response.status === 401) {
    expireSession();
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    if (body) {
      throw new ApiError(body);
    }
    throw new ApiError({
      statusCode: response.status,
      errorCode: "unknown_error",
      message: "Something went wrong.",
      path,
      timestamp: new Date().toISOString(),
    });
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
