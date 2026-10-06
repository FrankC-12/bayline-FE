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

export function formatDuration(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  const mm = minutes.toString().padStart(2, "0");
  const ss = seconds.toString().padStart(2, "0");
  if (hours === 0) return `${mm}:${ss}`;
  return `${hours}:${mm}:${ss}`;
}

export function formatElapsed(fromIso: string, toIso?: string | null): string {
  const from = new Date(fromIso).getTime();
  const to = toIso ? new Date(toIso).getTime() : Date.now();
  return formatDuration((to - from) / 1000);
}

/** A task cronómetro's live elapsed seconds: every previously-paused segment
 * (timer_accumulated_seconds) plus the currently-running one, if any. */
export function taskTimerElapsedSeconds(task: {
  timer_started_at: string | null;
  timer_accumulated_seconds: number;
}): number {
  if (!task.timer_started_at) return task.timer_accumulated_seconds;
  const runningSeconds = (Date.now() - new Date(task.timer_started_at).getTime()) / 1000;
  return task.timer_accumulated_seconds + Math.max(0, runningSeconds);
}