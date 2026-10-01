"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, GripVertical } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useBays } from "@/hooks/useBays";
import { useScheduledOrders } from "@/hooks/useScheduledOrders";
import { CALENDAR_TIME_ZONE, UNASSIGNED_BAY, calendarDate, calendarHour, calendarTimestamp, shiftCalendarDate, calendarLayout } from "@/lib/calendar";
import { useVehicleLookup } from "@/hooks/useVehicleLookUp";
import { useUserDirectory } from "@/hooks/useUserDirectory";
import { useRoleDirectory } from "@/hooks/useRoleDirectory";
import { capitalizeFirst } from "@/lib/format";
import ErrorState from "@/components/common/ErrorState";
import ConfigureBaysModal from "./ConfigureBaysModal";
import ScheduleOrderModal from "./ScheduledOrderModal";

export default function CalendarView() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;

  const [selectedDate, setSelectedDate] = useState(() => calendarDate(new Date()));
  const { bays, addBay, toggleActive, renameBay } = useBays(filialId);
  const { orders, activeOrders, loading, error, addOrder, rescheduleOrder, refresh } = useScheduledOrders(filialId, selectedDate);
  const unscheduledOrders = useMemo(
    () => activeOrders.filter((o) => !o.scheduled_at),
    [activeOrders]
  );
  const scheduledWithoutBay = useMemo(
    () => orders.filter((o) => !o.bay_id),
    [orders]
  );
  const { vehicleMap } = useVehicleLookup(filialId);
  const { users } = useUserDirectory({ filialId });
  const { roles } = useRoleDirectory("filial");

  const technicianRoleId = roles.find((r) => r.slug === "tecnico")?.id;
  const technicians = users.filter((u) => u.role_id === technicianRoleId);
  const advisorRoleId = roles.find((r) => r.slug === "asesor")?.id;
  const advisors = users.filter((u) => u.role_id === advisorRoleId);

  const [configureOpen, setConfigureOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [clickedSlot, setClickedSlot] = useState<{ hour: number; bayId: string } | null>(null);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);
  const draggingRef = useRef(false);

  function openScheduleModal(slot?: { hour: number; bayId: string }) {
    setClickedSlot(slot ?? null);
    setScheduleOpen(true);
  }

  const activeBays = useMemo(() => bays.filter((b) => b.is_active), [bays]);

  const { columns: calendarBays, hours } = useMemo(() => calendarLayout(orders, bays), [orders, bays]);

  const ordersByBayAndHour = useMemo(() => {
    const map = new Map<string, typeof orders>();
    for (const o of orders) {
      if (!o.scheduled_at) continue;
      const hour = calendarHour(o.scheduled_at);
      const key = `${o.bay_id ?? UNASSIGNED_BAY}-${hour}`;
      const arr = map.get(key) ?? [];
      arr.push(o);
      map.set(key, arr);
    }
    return map;
  }, [orders]);

  // Capitalize only the first letter — Spanish weekday/month names stay
  // lowercase mid-string ("viernes, 4 de septiembre", not "... De ...").
  const dateLabel = capitalizeFirst(
    new Date(`${selectedDate}T12:00:00-04:00`).toLocaleDateString("es-VE", {
      timeZone: CALENDAR_TIME_ZONE,
      weekday: "long",
      day: "numeric",
      month: "long",
    })
  );

  function shiftDate(days: number) {
    setSelectedDate(shiftCalendarDate(selectedDate, days));
  }

  function handleDragStart(e: React.DragEvent, orderId: string) {
    if (orders.some((order) => order.id === orderId && (!!order.invoiced_at || ["orden_cerrada", "cancelado"].includes(order.status)))) {
      e.preventDefault();
      return;
    }
    draggingRef.current = true;
    e.dataTransfer.setData("text/plain", orderId);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleCardClick(orderId: string) {
    if (draggingRef.current) {
      draggingRef.current = false;
      return;
    }
    router.push(`/dashboard/servicios/${orderId}`);
  }

  function handleDragOver(e: React.DragEvent, cellKey: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (hoveredCell !== cellKey) setHoveredCell(cellKey);
  }

  async function handleDrop(e: React.DragEvent, bayId: string, hour: number) {
    e.preventDefault();
    setHoveredCell(null);
    const orderId = e.dataTransfer.getData("text/plain");
    if (orders.some((order) => order.id === orderId && (!!order.invoiced_at || ["orden_cerrada", "cancelado"].includes(order.status)))) return;
    if (!orderId) return;

    const order = orders.find((o) => o.id === orderId);
    if (!order || !order.scheduled_at) return;

    const targetBay = bayId === UNASSIGNED_BAY ? null : bayId;
    if (calendarHour(order.scheduled_at) === hour && order.bay_id === targetBay) return;
    const minute = new Date(order.scheduled_at).getUTCMinutes();
    const scheduledAt = calendarTimestamp(selectedDate, `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);

    setMoveError(null);
    setMovingId(orderId);
    try {
      await rescheduleOrder(orderId, { scheduled_at: scheduledAt, bay_id: targetBay, clear_bay: targetBay === null });
    } catch (err) {
      setMoveError(err instanceof Error ? err.message : "No se pudo reagendar la ODS.");
    } finally {
      setMovingId(null);
    }
  }

  if (!filialId) return null;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-navy">Calendario del Taller</h1>
          <p className="mt-1 text-sm text-steel">{dateLabel}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setConfigureOpen(true)}
            className="rounded-full border border-navy/15 px-5 py-2.5 text-sm font-semibold text-navy transition hover:border-navy/40"
          >
            Configurar bahías
          </button>
          <button
            onClick={() => openScheduleModal()}
            className="rounded-full bg-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy"
          >
            + Agendar Orden de Servicio
          </button>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-2">
        <button
          onClick={() => shiftDate(-1)}
          aria-label="Día anterior"
          className="rounded-lg border border-navy/15 p-2 text-steel hover:text-navy"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => { if (e.target.value) setSelectedDate(e.target.value); }}
          className="rounded-lg border border-navy/15 px-3 py-2 text-sm outline-none focus:border-blue"
        />
        <button
          onClick={() => shiftDate(1)}
          aria-label="Día siguiente"
          className="rounded-lg border border-navy/15 p-2 text-steel hover:text-navy"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          onClick={() => setSelectedDate(calendarDate(new Date()))}
          className="rounded-lg border border-navy/15 px-3 py-2 text-sm text-steel hover:text-navy"
        >
          Hoy
        </button>
      </div>

      <p className="mb-6 flex items-center gap-1.5 text-xs text-steel">
        <GripVertical className="h-3.5 w-3.5" />
        Arrastra una cita a otra hora o bahía para reagendarla. Haz clic en un espacio libre para agendar una nueva.
      </p>

      {moveError && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{moveError}</p>}
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
          {loading ? (
            <div className="p-12 text-center text-sm text-steel">
              Cargando agenda...
            </div>
          ) : error ? (
            <div className="p-6"><ErrorState error={error} onRetry={refresh} /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-navy/10 bg-ash">
                    <th className="w-20 px-4 py-3" />
                    {calendarBays.map((b) => (
                      <th
                        key={b.id}
                        className="px-4 py-3 font-mono text-[11px] uppercase tracking-widest text-steel"
                      >
                        {b.name}{!b.is_active && " (inactiva)"}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {hours.map((hour) => (
                    <tr key={hour} className="border-b border-navy/5">
                      <td className="px-4 py-4 font-mono text-xs text-steel">
                        {hour.toString().padStart(2, "0")}:00
                      </td>
                      {calendarBays.map((b) => {
                        const cellKey = `${b.id}-${hour}`;
                        const cellOrders = ordersByBayAndHour.get(cellKey) ?? [];
                        const isHovered = hoveredCell === cellKey;
                        const isEmpty = cellOrders.length === 0;
                        return (
                          <td
                            key={b.id}
                            onDragOver={(e) => { if (b.is_active) handleDragOver(e, cellKey); }}
                            onDragLeave={() => setHoveredCell((prev) => (prev === cellKey ? null : prev))}
                            onDrop={(e) => { if (b.is_active) void handleDrop(e, b.id, hour); }}
                            onClick={() => {
                              if (isEmpty && b.is_active) openScheduleModal({ hour, bayId: b.id === UNASSIGNED_BAY ? "" : b.id });
                            }}
                            title={isEmpty && b.is_active ? "Clic para agendar una orden de servicio" : undefined}
                            className={`border-l border-navy/5 px-2 py-2 align-top transition-colors ${
                              isHovered ? "bg-blue-light/70" : isEmpty && b.is_active ? "cursor-pointer hover:bg-ash" : ""
                            }`}
                          >
                            {cellOrders.map((o) => {
                              const info = vehicleMap.get(o.vehicle_id);
                              return (
                                <div
                                  key={o.id}
                                  draggable={!o.invoiced_at && !["orden_cerrada", "cancelado"].includes(o.status)}
                                  onDragStart={(e) => handleDragStart(e, o.id)}
                                  onDragEnd={() => { draggingRef.current = false; setHoveredCell(null); }}
                                  onClick={() => handleCardClick(o.id)}
                                  className={`mb-1 cursor-grab rounded-lg bg-blue-light px-2 py-1.5 text-xs text-blue transition last:mb-0 hover:bg-blue hover:text-white active:cursor-grabbing ${
                                    movingId === o.id ? "opacity-50" : ""
                                  }`}
                                >
                                  <p className="font-semibold">{o.code} · {o.scheduled_at && new Date(o.scheduled_at).toLocaleTimeString("es-VE", { timeZone: CALENDAR_TIME_ZONE, hour: "2-digit", minute: "2-digit" })}</p>
                                  <p>{info?.vehicle.plate ?? "Sin placa"}</p>
                                  <p className="opacity-80">{info?.client.full_name}</p>
                                </div>
                              );
                            })}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-navy/10 bg-white p-5">
            <p className="mb-3 font-display font-bold text-navy">Citas del día seleccionado</p>
            {loading ? (
              <p className="text-sm text-steel">Cargando...</p>
            ) : error ? (
              <ErrorState error={error} onRetry={refresh} compact />
            ) : orders.length === 0 ? (
              <p className="text-sm italic text-steel">No hay citas programadas para esta fecha.</p>
            ) : (
              <div className="space-y-2">
                {orders
                  .slice()
                  .sort((a, b) => (a.scheduled_at ?? "").localeCompare(b.scheduled_at ?? ""))
                  .map((o) => {
                    const info = vehicleMap.get(o.vehicle_id);
                    return (
                      <Link
                        key={o.id}
                        href={`/dashboard/servicios/${o.id}`}
                        className="block rounded-xl border border-navy/10 px-3 py-2 text-sm transition hover:bg-ash"
                      >
                        <p className="font-mono text-xs text-blue">
                          {o.scheduled_at &&
                            new Date(o.scheduled_at).toLocaleTimeString("es-VE", {
                              timeZone: CALENDAR_TIME_ZONE,
                            hour: "2-digit",
                              minute: "2-digit",
                            })}
                        </p>
                        <p className="font-medium text-navy">
                          {info ? `${info.vehicle.brand} ${info.vehicle.model}` : o.code}
                        </p>
                        <p className="text-xs text-steel">{info?.client.full_name}</p>
                      </Link>
                    );
                  })}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-navy/10 bg-white p-5">
            <p className="mb-1 font-display font-bold text-navy">Sin agendar</p>
            <p className="mb-3 text-xs text-steel">
              Órdenes activas del Kanban que todavía no tienen fecha/hora asignada.
            </p>
            {unscheduledOrders.length === 0 ? (
              <p className="text-sm italic text-steel">No hay órdenes activas sin agendar.</p>
            ) : (
              <div className="space-y-2">
                {unscheduledOrders.map((o) => {
                  const info = vehicleMap.get(o.vehicle_id);
                  return (
                    <Link
                      key={o.id}
                      href={`/dashboard/servicios/${o.id}`}
                      className="block rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm transition hover:bg-amber-100"
                    >
                      <p className="font-medium text-navy">
                        {info ? `${info.vehicle.brand} ${info.vehicle.model}` : o.code}
                      </p>
                      <p className="text-xs text-steel">{info?.client.full_name}</p>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-navy/10 bg-white p-5">
            <p className="mb-1 font-display font-bold text-navy">Sin bahía asignada</p>
            <p className="mb-3 text-xs text-steel">
              Órdenes agendadas (fecha/hora) a las que todavía no se les eligió una bahía.
            </p>
            {scheduledWithoutBay.length === 0 ? (
              <p className="text-sm italic text-steel">No hay órdenes agendadas sin bahía.</p>
            ) : (
              <div className="space-y-2">
                {scheduledWithoutBay.map((o) => {
                  const info = vehicleMap.get(o.vehicle_id);
                  return (
                    <Link
                      key={o.id}
                      href={`/dashboard/servicios/${o.id}`}
                      className="block rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm transition hover:bg-amber-100"
                    >
                      <p className="font-mono text-xs text-blue">
                        {o.scheduled_at &&
                          new Date(o.scheduled_at).toLocaleString("es-VE", {
                            day: "2-digit",
                            month: "2-digit",
                            timeZone: CALENDAR_TIME_ZONE,
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                      </p>
                      <p className="font-medium text-navy">
                        {info ? `${info.vehicle.brand} ${info.vehicle.model}` : o.code}
                      </p>
                      <p className="text-xs text-steel">{info?.client.full_name}</p>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfigureBaysModal
        open={configureOpen}
        onClose={() => setConfigureOpen(false)}
        bays={bays}
        onToggle={toggleActive}
        onAdd={async (name) => {
          await addBay(name);
        }}
        onRename={renameBay}
      />

      <ScheduleOrderModal
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        filialId={filialId}
        defaultDate={selectedDate}
        defaultTime={clickedSlot ? `${clickedSlot.hour.toString().padStart(2, "0")}:00` : undefined}
        defaultBayId={clickedSlot?.bayId}
        hours={hours}
        bays={activeBays}
        technicians={technicians}
        advisors={advisors}
        onSubmit={async (input) => {
          const created = await addOrder(input);
          if (created.scheduled_at) setSelectedDate(calendarDate(created.scheduled_at));
        }}
      />
    </div>
  );
}