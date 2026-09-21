import { ApiError, ApiTimeoutError } from "./client";

export type ListErrorKind = "forbidden" | "server" | "timeout" | "unknown";

export interface ListErrorInfo {
  kind: ListErrorKind;
  message: string;
}

/** Sorts a failed list-load into the three cases a screen must tell apart
 * (403, 500, timeout/offline) plus a fallback for anything else, so every
 * listing can show a specific, correct message instead of one generic
 * "algo salió mal." */
export function classifyListError(err: unknown): ListErrorInfo {
  if (err instanceof ApiTimeoutError) {
    return { kind: "timeout", message: err.message };
  }
  if (err instanceof ApiError) {
    if (err.statusCode === 403) {
      return { kind: "forbidden", message: "No tienes permiso para ver esta información." };
    }
    if (err.statusCode >= 500) {
      return { kind: "server", message: "Ocurrió un error en el servidor. Intenta de nuevo en un momento." };
    }
    return { kind: "unknown", message: err.message || "No se pudo cargar la información." };
  }
  return { kind: "unknown", message: "No se pudo cargar la información." };
}
