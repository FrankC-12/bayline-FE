/** The timestamp a service order's elapsed-time counter should freeze at —
 * null while it's still pendiente/en_progreso and should keep ticking.
 * Covers completada, facturada (a sub-state of completado, so no separate
 * check needed) and cancelada, plus orden_cerrada. */
export function serviceOrderStoppedAt(order: {
  status: string;
  cancelled_at?: string | null;
  closed_at?: string | null;
  completed_at?: string | null;
}): string | null {
  if (order.status === "cancelado") return order.cancelled_at ?? null;
  if (order.status === "orden_cerrada") return order.closed_at ?? null;
  if (order.status === "completado") return order.completed_at ?? null;
  return null;
}

export function formatElapsed(fromIso: string, toIso?: string | null): string {
  const from = new Date(fromIso).getTime();
  const to = toIso ? new Date(toIso).getTime() : Date.now();
  const totalSeconds = Math.max(0, Math.floor((to - from) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const mm = minutes.toString().padStart(2, "0");
  const ss = seconds.toString().padStart(2, "0");
  if (hours === 0) return `${mm}:${ss}`;
  return `${hours}:${mm}:${ss}`;
}