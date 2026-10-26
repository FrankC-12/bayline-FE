import { calendarDate, calendarHour } from "./calendar";
import type { ServiceOrder } from "@/types/serviceOrder";
export const WORKSHOP_STAGES: Record<string, { label: string; style: string }> =
  {
    borrador: {
      label: "Borrador",
      style: "border-slate-300 bg-white text-steel",
    },
    agendada: {
      label: "Agendada",
      style: "border-slate-400 bg-white text-steel",
    },
    en_revision: {
      label: "En revisión",
      style: "border-amber-400 bg-amber-50 text-amber-800",
    },
    esperando_repuestos: {
      label: "Esperando repuestos",
      style: "border-orange-400 bg-orange-50 text-orange-800",
    },
    en_trabajo: {
      label: "En progreso",
      style: "border-blue bg-blue-light text-blue",
    },
    por_facturar: {
      label: "Pendiente de facturar",
      style: "border-emerald-400 bg-emerald-50 text-emerald-800",
    },
    por_entregar: {
      label: "Pendiente de entrega",
      style: "border-emerald-400 bg-emerald-50 text-emerald-800",
    },
    por_cobrar: {
      label: "Por cobrar",
      style: "border-emerald-400 bg-emerald-50 text-emerald-800",
    },
    cancelada: {
      label: "Cancelada",
      style: "border-red-300 bg-red-50 text-red-700",
    },
    cerrada: {
      label: "Cerrada",
      style: "border-slate-300 bg-slate-100 text-steel",
    },
  };
export function orderStage(order: ServiceOrder) {
  return (
    order.workshop_stage ??
    (order.is_draft
      ? order.scheduled_at
        ? "agendada"
        : "borrador"
      : {
          pendiente: "en_revision",
          en_progreso: "en_trabajo",
          completado: order.invoiced_at ? "por_cobrar" : "por_facturar",
          orden_cerrada: "cerrada",
          cancelado: "cancelada",
        }[order.status])
  );
}
export function calendarBlocks(
  orders: ServiceOrder[],
  day: string,
  today: string,
) {
  return orders.flatMap((order) => {
    if (!order.scheduled_at && !order.vehicle_received_at) return [];
    const stamp =
      order.scheduled_at ||
      order.vehicle_received_at ||
      order.cancelled_at ||
      order.closed_at ||
      order.submitted_at ||
      order.created_at;
    const scheduled =
      !!order.scheduled_at && calendarDate(order.scheduled_at) === day;
    const live =
      !order.is_draft &&
      !["agendada", "cerrada", "cancelada"].includes(orderStage(order));
    const recorded = !order.is_draft && calendarDate(stamp) === day;
    if (!scheduled && !recorded && !(day === today && live)) return [];
    const sameDay = calendarDate(stamp) === day;
    const minute = Number(
      new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Caracas",
        minute: "2-digit",
      }).format(new Date(stamp)),
    );
    const start = sameDay ? calendarHour(stamp) + minute / 60 : 8;
    return [
      {
        order,
        start,
        duration: Math.max(0.5, order.estimated_hours || 0),
        estimated: order.estimated_hours || 0,
      },
    ];
  });
}
export function slotAvailable(
  blocks: ReturnType<typeof calendarBlocks>,
  bayId: string,
  start: number,
  duration = 0.5,
  excludeId?: string,
) {
  return !blocks.some(
    (b) =>
      b.order.id !== excludeId &&
      b.order.bay_id === bayId &&
      start < b.start + b.duration &&
      start + duration > b.start,
  );
}
export function positionBlocks(blocks: ReturnType<typeof calendarBlocks>) {
  const arranged = [...blocks].sort(
    (a, b) => a.start - b.start || a.order.id.localeCompare(b.order.id),
  );
  const ends: number[] = [];
  const result = arranged.map((block) => {
    let lane = ends.findIndex((end) => end <= block.start);
    if (lane < 0) lane = ends.length;
    ends[lane] = block.start + block.duration;
    return { ...block, lane };
  });
  return result.map((block) => ({
    ...block,
    lanes: Math.max(
      1,
      ...result
        .filter(
          (other) =>
            other.start < block.start + block.duration &&
            other.start + other.duration > block.start,
        )
        .map((other) => other.lane + 1),
    ),
  }));
}
