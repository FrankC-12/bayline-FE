import type { Bay, ServiceOrder } from "@/types/serviceOrder";

export const CALENDAR_TIME_ZONE = "America/Caracas";
export const CALENDAR_HOURS = Array.from({ length: 11 }, (_, i) => 8 + i);
export const UNASSIGNED_BAY = "unassigned";

/** Calendar dates and slots always use workshop time, regardless of the device's timezone. */
export function calendarDate(value: string | Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CALENDAR_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date(value));
  const part = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function calendarHour(value: string): number {
  return Number(new Intl.DateTimeFormat("en-US", {
    timeZone: CALENDAR_TIME_ZONE, hour: "2-digit", hourCycle: "h23",
  }).format(new Date(value)));
}

export function calendarTimestamp(date: string, time: string): string {
  return new Date(`${date}T${time}:00-04:00`).toISOString();
}

export function shiftCalendarDate(date: string, days: number): string {
  const day = new Date(`${date}T12:00:00Z`);
  day.setUTCDate(day.getUTCDate() + days);
  return day.toISOString().slice(0, 10);
}

export function scheduledOrdersForDate(orders: ServiceOrder[], date: string): ServiceOrder[] {
  return orders.filter((order) => order.scheduled_at && calendarDate(order.scheduled_at) === date);
}

/** Keep every scheduled order visible, including inactive/missing bays and unusual hours. */
export function calendarLayout(orders: ServiceOrder[], bays: Bay[]) {
  const assigned = new Set(orders.map((order) => order.bay_id).filter(Boolean));
  const columns = bays.filter((bay) => bay.is_active || assigned.has(bay.id));
  for (const id of Array.from(assigned)) {
    if (id && !columns.some((bay) => bay.id === id)) {
      columns.push({ id, name: "Bahía no disponible", is_active: false, filial_id: "" });
    }
  }
  columns.push({ id: UNASSIGNED_BAY, name: "Sin bahía asignada", is_active: true, filial_id: "" });
  const hours = Array.from(new Set([...CALENDAR_HOURS, ...orders.flatMap((order) =>
    order.scheduled_at ? [calendarHour(order.scheduled_at)] : [])])).sort((a, b) => a - b);
  return { columns, hours };
}
