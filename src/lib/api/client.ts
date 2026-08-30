const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
const TOKEN_STORAGE_KEY = "bayline_access_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
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

  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string>),
  };

  if (auth) {
    const token = getToken();
    if (token) {
      finalHeaders.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...rest, headers: finalHeaders });

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