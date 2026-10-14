"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

const ERROR_TYPES = new Set(["Error", "TypeError", "RangeError", "ReferenceError", "SyntaxError"]);

export default function ClientErrorReporter() {
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;
    let reported = 0;
    let windowStarted = Date.now();
    const pending = new Set<AbortController>();

    const report = (kind: "javascript_error" | "unhandled_rejection", error: unknown) => {
      if (navigator.onLine === false) return;
      const now = Date.now();
      if (now - windowStarted > 60000) { reported = 0; windowStarted = now; }
      if (reported >= 5) return;
      reported++;
      const pathname = window.location.pathname;
      const area = pathname.includes("/ordenes") || pathname.includes("/asesor-servicios") ? "service_orders"
        : pathname.includes("/clientes") ? "clients"
        : pathname.includes("/almacen") || pathname.includes("/repuestos") ? "inventory"
        : pathname.includes("/finanzas") || pathname.includes("/administracion") ? "finance"
        : pathname.includes("/ajustes") ? "settings" : "other";
      const name = error instanceof Error ? error.name : "Unknown";
      const controller = new AbortController();
      pending.add(controller);
      const timeout = setTimeout(() => controller.abort(), 5000);
      // A raw request avoids token refresh and telemetry recursion if this fails.
      void fetch("/api/v1/telemetry/errors", {
        method: "POST", credentials: "include", signal: controller.signal,
        headers: { "Content-Type": "application/json", "X-CSRF-Protection": "1" },
        body: JSON.stringify({ platform: "web", kind, error_type: ERROR_TYPES.has(name) ? name : "Unknown", area }),
      }).catch(() => {}).finally(() => { clearTimeout(timeout); pending.delete(controller); });
    };
    const onError = (event: ErrorEvent) => report("javascript_error", event.error);
    const onRejection = (event: PromiseRejectionEvent) => report("unhandled_rejection", event.reason);
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
      pending.forEach((controller) => controller.abort());
    };
  }, [currentUser]);

  return null;
}
