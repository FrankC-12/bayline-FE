"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, GripVertical } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useBays } from "@/hooks/useBays";
import { useScheduledOrders } from "@/hooks/useScheduledOrders";
import { useVehicleLookup } from "@/hooks/useVehicleLookUp";
import { useUsers } from "@/hooks/useUser";
import { useRoles } from "@/hooks/useRoles";
import ConfigureBaysModal from "./ConfigureBaysModal";
import ScheduleOrderModal from "./ScheduledOrderModal";

const HOURS = Array.from({ length: 11 }, (_, i) => 8 + i); // 08:00 .. 18:00

function toDateInputValue(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function CalendarView() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;

  const [selectedDate, setSelectedDate] = useState(() => toDateInputValue(new Date()));
  const { bays, addBay, toggleActive } = useBays(filialId);
  const { orders, loading, addOrder, rescheduleOrder } = useScheduledOrders(filialId, selectedDate);
  const { vehicleMap } = useVehicleLookup(filialId);
  const { users } = useUsers({ filialId });
  const { roles } = useRoles("filial");

  const technicianRoleId = roles.find((r) => r.slug === "tecnico")?.id;
  const technicians = users.filter((u) => u.role_id === technicianRoleId);

  const [configureOpen, setConfigureOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);
  const draggingRef = useRef(false);

  const activeBays = useMemo(() => bays.filter((b) => b.is_active), [bays]);

  const ordersByBayAndHour = useMemo(() => {
    const map = new Map<string, typeof orders>();
    for (const o of orders) {
      if (!o.scheduled_at || !o.bay_id) continue;
      const hour = new Date(o.scheduled_at).getHours();
      const key = `${o.bay_id}-${hour}`;
      const arr = map.get(key) ?? [];
      arr.push(o);
      map.set(key, arr);
    }
    return map;
  }, [orders]);

  const dateLabel = new Date(`${selectedDate}T00:00:00`).toLocaleDateString("es-VE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  function shiftDate(days: number) {
    const d = new Date(`${selectedDate}T00:00:00`);
    d.setDate(d.getDate() + days);
    setSelectedDate(toDateInputValue(d));
  }

  function handleDragStart(e: React.DragEvent, orderId: string) {
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
    if (!orderId) return;

    const order = orders.find((o) => o.id === orderId);
    if (!order || !order.scheduled_at) return;

    const current = new Date(order.scheduled_at);
    if (current.getHours() === hour && order.bay_id === bayId) return; // dropped in place

    const newDate = new Date(current);
    newDate.setHours(hour, current.getMinutes(), 0, 0);

    setMovingId(orderId);
    try {
      await rescheduleOrder(orderId, { scheduled_at: newDate.toISOString(), bay_id: bayId });
    } finally {
      setMovingId(null);
    }
  }

  if (!filialId) return null;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold capitalize text-navy">Calendario del Taller</h1>
          <p className="mt-1 text-sm capitalize text-steel">{dateLabel}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setConfigureOpen(true)}
            className="rounded-full border border-navy/15 px-5 py-2.5 text-sm font-semibold text-navy transition hover:border-navy/40"
          >
            Configurar bahías
          </button>
          <button
            onClick={() => setScheduleOpen(true)}
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
          onChange={(e) => setSelectedDate(e.target.value)}
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
          onClick={() => setSelectedDate(toDateInputValue(new Date()))}
          className="rounded-lg border border-navy/15 px-3 py-2 text-sm text-steel hover:text-navy"
        >
          Hoy
        </button>
      </div>

      <p className="mb-6 flex items-center gap-1.5 text-xs text-steel">
        <GripVertical className="h-3.5 w-3.5" />
        Arrastrá una cita a otra hora o bahía para reagendarla.
      </p>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
          {activeBays.length === 0 ? (
            <div className="p-12 text-center text-sm text-steel">
              No hay bahías activas. Configúralas para empezar a agendar.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-navy/10 bg-ash">
                    <th className="w-20 px-4 py-3" />
                    {activeBays.map((b) => (
                      <th
                        key={b.id}
                        className="px-4 py-3 font-mono text-[11px] uppercase tracking-widest text-steel"
                      >
                        {b.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {HOURS.map((hour) => (
                    <tr key={hour} className="border-b border-navy/5">
                      <td className="px-4 py-4 font-mono text-xs text-steel">
                        {hour.toString().padStart(2, "0")}:00
                      </td>
                      {activeBays.map((b) => {
                        const cellKey = `${b.id}-${hour}`;
                        const cellOrders = ordersByBayAndHour.get(cellKey) ?? [];
                        const isHovered = hoveredCell === cellKey;
                        return (
                          <td
                            key={b.id}
                            onDragOver={(e) => handleDragOver(e, cellKey)}
                            onDragLeave={() => setHoveredCell((prev) => (prev === cellKey ? null : prev))}
                            onDrop={(e) => handleDrop(e, b.id, hour)}
                            className={`border-l border-navy/5 px-2 py-2 align-top transition-colors ${
                              isHovered ? "bg-blue-light/70" : ""
                            }`}
                          >
                            {cellOrders.map((o) => {
                              const info = vehicleMap.get(o.vehicle_id);
                              return (
                                <div
                                  key={o.id}
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, o.id)}
                                  onClick={() => handleCardClick(o.id)}
                                  className={`mb-1 cursor-grab rounded-lg bg-blue-light px-2 py-1.5 text-xs text-blue transition last:mb-0 hover:bg-blue hover:text-white active:cursor-grabbing ${
                                    movingId === o.id ? "opacity-50" : ""
                                  }`}
                                >
                                  <p className="font-semibold">{info?.vehicle.plate ?? o.code}</p>
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

        <div className="rounded-2xl border border-navy/10 bg-white p-5">
          <p className="mb-3 font-display font-bold text-navy">Citas de Hoy</p>
          {loading ? (
            <p className="text-sm text-steel">Cargando...</p>
          ) : orders.length === 0 ? (
            <p className="text-sm italic text-steel">No hay citas programadas para hoy.</p>
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

      <ConfigureBaysModal
        open={configureOpen}
        onClose={() => setConfigureOpen(false)}
        bays={bays}
        onToggle={toggleActive}
        onAdd={async (name) => {
          await addBay(name);
        }}
      />

      <ScheduleOrderModal
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        filialId={filialId}
        defaultDate={selectedDate}
        hours={HOURS}
        bays={activeBays}
        technicians={technicians}
        onSubmit={async (input) => {
          await addOrder(input);
        }}
      />
    </div>
  );
}