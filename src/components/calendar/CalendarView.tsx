"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Settings2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserDirectory } from "@/hooks/useUserDirectory";
import { useBays } from "@/hooks/useBays";
import { useServiceOrders } from "@/hooks/useServiceOrders";
import { useVehicleLookup } from "@/hooks/useVehicleLookUp";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import {
  calendarDate,
  calendarTimestamp,
  shiftCalendarDate,
} from "@/lib/calendar";
import {
  calendarBlocks,
  positionBlocks,
  slotAvailable,
  WORKSHOP_STAGES,
  orderStage,
} from "@/lib/workshopCalendar";
import {
  createOrderDraft,
  saveOrderDraft,
  updateServiceOrder,
} from "@/lib/api/serviceOrders";
import { formatCount } from "@/lib/format";
import Modal from "@/components/common/Modal";
import ErrorState from "@/components/common/ErrorState";

export default function CalendarView() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;
  const { canEdit } = useModuleAccess("asesor-servicios");
  const { canEdit: canConfigure } = useModuleAccess("ajustes");
  const { bays } = useBays(filialId);
  const { users } = useUserDirectory({ filialId });
  const { orders, loading, error, refresh } = useServiceOrders(filialId, "all");
  const { vehicleMap } = useVehicleLookup(filialId);
  const today = calendarDate(new Date());
  const [day, setDay] = useState(today);
  const [selected, setSelected] = useState<string | null>(null);
  const [slot, setSlot] = useState<{ bayId: string; hour: number } | null>(
    null,
  );
  const [vehicle, setVehicle] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setError] = useState<string | null>(null);
  const blocks = useMemo(
    () => calendarBlocks(orders, day, today),
    [orders, day, today],
  );
  const visibleBays = bays.filter(
    (b) => b.is_active || blocks.some((block) => block.order.bay_id === b.id),
  );
  const missingBayIds = Array.from(
    new Set(
      blocks
        .map((b) => b.order.bay_id)
        .filter(
          (id): id is string => !!id && !visibleBays.some((b) => b.id === id),
        ),
    ),
  );
  const columns = [
    ...visibleBays,
    ...missingBayIds.map((id) => ({
      id,
      name: "Bahía no disponible",
      is_active: false,
      filial_id: filialId ?? "",
    })),
  ];
  const startHour = Math.min(8, ...blocks.map((b) => Math.floor(b.start)));
  const endHour = Math.max(
    18,
    ...blocks.map((b) => Math.ceil(b.start + b.duration)),
  );
  const hours = Array.from(
    { length: endHour - startHour },
    (_, i) => startHour + i,
  );
  const unscheduled = orders.filter(
    (o) =>
      (o.is_draft && !o.scheduled_at) ||
      (o.scheduled_at && calendarDate(o.scheduled_at) === day && !o.bay_id),
  );
  const label = (id: string | null) => {
    const info = vehicleMap.get(id ?? "");
    return info
      ? `${info.vehicle.brand} ${info.vehicle.model} ${info.vehicle.year ?? ""}`
      : "Vehículo por seleccionar";
  };
  async function place(bayId: string, hour: number, id = selected) {
    setError(null);
    const order = orders.find((o) => o.id === id);
    if (
      !slotAvailable(
        blocks,
        bayId,
        hour,
        Math.max(0.5, order?.estimated_hours || 0),
        id ?? undefined,
      )
    ) {
      setError("Este horario ya está ocupado. Elige otro espacio.");
      return;
    }
    if (!id) {
      setSlot({ bayId, hour });
      setVehicle("");
      return;
    }
    if (!order) return;
    setBusy(true);
    try {
      const data = {
        bay_id: bayId,
        scheduled_at: calendarTimestamp(
          day,
          `${String(hour).padStart(2, "0")}:00`,
        ),
      };
      if (order.is_draft) await saveOrderDraft(id, data);
      else await updateServiceOrder(id, data);
      setSelected(null);
      await refresh();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo asignar el horario.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function create() {
    if (!filialId || !slot || !vehicle) return;
    setBusy(true);
    setError(null);
    try {
      const order = await createOrderDraft({
        filial_id: filialId,
        vehicle_id: vehicle,
        bay_id: slot.bayId,
        scheduled_at: calendarTimestamp(
          day,
          `${String(slot.hour).padStart(2, "0")}:00`,
        ),
      });
      router.push(`/dashboard/servicios/${order.id}`);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo crear el borrador.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="min-w-0">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-navy">
            Calendario del taller
          </h1>
          <p className="mt-2 text-sm text-steel">
            Bahías, trabajo en curso y citas agendadas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            aria-label="Día anterior"
            onClick={() => setDay(shiftCalendarDate(day, -1))}
            className="rounded-full border bg-white p-2"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <input
            aria-label="Fecha del calendario"
            type="date"
            value={day}
            onChange={(e) => e.target.value && setDay(e.target.value)}
            className="rounded-xl border border-navy/15 bg-white px-3 py-2 text-sm"
          />
          <button
            aria-label="Día siguiente"
            onClick={() => setDay(shiftCalendarDate(day, 1))}
            className="rounded-full border bg-white p-2"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDay(today)}
            className="rounded-full border bg-white px-3 py-2 text-sm"
          >
            Hoy
          </button>
        </div>
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {[
          "agendada",
          "en_revision",
          "esperando_repuestos",
          "en_trabajo",
          "por_cobrar",
          "cancelada",
          "cerrada",
        ].map((stage) => (
          <span
            key={stage}
            className={`rounded-full border px-2.5 py-1 text-xs ${WORKSHOP_STAGES[stage].style}`}
          >
            {WORKSHOP_STAGES[stage].label} ·{" "}
            {blocks.filter((b) => orderStage(b.order) === stage).length}
          </span>
        ))}
        <p className="ml-auto text-xs text-steel">
          {selected
            ? "Ahora toca una hora libre para asignar el borrador"
            : "Toca una hora libre para crear una ODS"}
        </p>
      </div>
      {actionError && (
        <p
          role="alert"
          className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700"
        >
          {actionError}
        </p>
      )}
      {loading ? (
        <p className="p-8 text-steel">Cargando agenda…</p>
      ) : error ? (
        <ErrorState error={error} onRetry={refresh} />
      ) : !columns.length ? (
        <div className="rounded-2xl border border-dashed border-navy/20 bg-white p-8 text-center">
          <p className="text-sm text-steel">No hay bahías configuradas.</p>
          {canConfigure && (
            <Link
              href="/dashboard/ajustes/bahias"
              className="mt-3 inline-block font-semibold text-blue underline"
            >
              Configurarlas en Ajustes
            </Link>
          )}
        </div>
      ) : (
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_230px]">
          <div className="overflow-x-auto rounded-2xl border border-navy/10 bg-white">
            <div style={{ minWidth: Math.max(520, columns.length * 190 + 54) }}>
              <div
                className="grid border-b border-navy/10"
                style={{
                  gridTemplateColumns: `54px repeat(${columns.length},minmax(0,1fr))`,
                }}
              >
                <div className="p-2 text-xs text-steel">Hora</div>
                {columns.map((bay) => {
                  const load = blocks
                    .filter(
                      (b) =>
                        b.order.bay_id === bay.id &&
                        !["cancelada", "cerrada"].includes(orderStage(b.order)),
                    )
                    .reduce((sum, b) => sum + b.estimated, 0);
                  return (
                    <div key={bay.id} className="border-l border-navy/10 p-3">
                      <div className="flex items-center justify-between">
                        <b className="text-sm text-navy">{bay.name}</b>
                        {canConfigure && (
                          <Link
                            aria-label="Configurar bahías"
                            href="/dashboard/ajustes/bahias"
                            className="text-steel hover:text-blue"
                          >
                            <Settings2 className="h-3.5 w-3.5" />
                          </Link>
                        )}
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full ${load > 8 ? "bg-red-500" : "bg-emerald-500"}`}
                          style={{ width: `${Math.min(100, load * 10)}%` }}
                        />
                      </div>
                      <p className="mt-1 text-[10px] text-steel">
                        {load.toLocaleString("es-VE")} h de 10 h
                      </p>
                    </div>
                  );
                })}
              </div>
              <div
                className="grid"
                style={{
                  gridTemplateColumns: `54px repeat(${columns.length},minmax(0,1fr))`,
                }}
              >
                <div>
                  {hours.map((hour) => (
                    <div
                      key={hour}
                      style={{ height: 60 }}
                      className="border-b border-navy/5 px-2 pt-1 font-mono text-[10px] text-steel"
                    >
                      {String(hour).padStart(2, "0")}:00
                    </div>
                  ))}
                </div>
                {columns.map((bay) => (
                  <div
                    key={bay.id}
                    className="relative border-l border-navy/10"
                    style={{ height: hours.length * 60 }}
                  >
                    {hours.map((hour) => (
                      <button
                        key={hour}
                        disabled={busy || !canEdit || !bay.is_active}
                        aria-label={`${bay.name}, ${hour}:00, asignar horario`}
                        onClick={() => void place(bay.id, hour)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          void place(
                            bay.id,
                            hour,
                            e.dataTransfer.getData("text/plain"),
                          );
                        }}
                        className="absolute inset-x-0 border-b border-navy/5 transition hover:bg-blue-light/40 disabled:hover:bg-transparent"
                        style={{ top: (hour - startHour) * 60, height: 60 }}
                      />
                    ))}
                    {positionBlocks(
                      blocks.filter((b) => b.order.bay_id === bay.id),
                    ).map((b) => {
                      const stage = orderStage(b.order);
                      return (
                        <Link
                          key={b.order.id}
                          href={`/dashboard/servicios/${b.order.id}`}
                          className={`absolute overflow-hidden rounded-lg border border-l-[3px] p-2 text-xs transition hover:shadow-md ${WORKSHOP_STAGES[stage]?.style ?? WORKSHOP_STAGES.en_revision.style} ${stage === "agendada" || b.order.is_draft ? "border-dashed" : ""}`}
                          style={{
                            top: (b.start - startHour) * 60 + 2,
                            height: Math.max(28, b.duration * 60 - 4),
                            left: `calc(${(b.lane / b.lanes) * 100}% + 3px)`,
                            width: `calc(${100 / b.lanes}% - 6px)`,
                          }}
                        >
                          <span className="flex justify-between gap-1 font-mono text-[10px]">
                            <b>{b.order.code}</b>
                            <span>
                              {Math.floor(b.start).toString().padStart(2, "0")}:
                              {String(Math.round((b.start % 1) * 60)).padStart(
                                2,
                                "0",
                              )}
                            </span>
                          </span>
                          <p className="mt-1 truncate font-semibold">
                            {label(b.order.vehicle_id)}
                          </p>
                          <p className="mt-1 truncate text-[10px]">
                            {users.find(
                              (user) => user.id === b.order.technician_user_id,
                            )?.full_name ?? "Sin técnico"}{" "}
                            · {WORKSHOP_STAGES[stage]?.label}
                          </p>
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <aside className="rounded-2xl border border-navy/10 bg-white p-4">
            <div className="flex justify-between gap-3">
              <h2 className="text-sm font-bold text-navy">
                Sin agendar / sin bahía
              </h2>
              <span className="text-xs text-steel">
                {formatCount(unscheduled.length)}
              </span>
            </div>
            <p className="mt-2 text-xs text-steel">
              Selecciona un borrador y toca una hora libre, o arrástralo a una
              bahía.
            </p>
            <div className="mt-4 space-y-3">
              {unscheduled.map((o) => (
                <button
                  key={o.id}
                  draggable={canEdit}
                  disabled={!canEdit || busy}
                  onDragStart={(e) =>
                    e.dataTransfer.setData("text/plain", o.id)
                  }
                  onClick={() => setSelected(selected === o.id ? null : o.id)}
                  className={`w-full rounded-xl border border-dashed p-3 text-left ${selected === o.id ? "border-blue bg-blue-light" : "border-navy/20 bg-slate-50"}`}
                >
                  <span className="flex justify-between gap-3 font-mono text-[10px] text-blue">
                    <b>{o.code}</b>
                    <span>{o.estimated_hours || 0} h</span>
                  </span>
                  <p className="mt-2 text-xs font-semibold text-navy">
                    {label(o.vehicle_id)}
                  </p>
                  <p className="mt-1 text-[11px] text-steel">
                    {vehicleMap.get(o.vehicle_id ?? "")?.vehicle.plate ||
                      "Sin placa"}{" "}
                    ·{" "}
                    {vehicleMap.get(o.vehicle_id ?? "")?.client.full_name ??
                      "Sin cliente"}{" "}
                    · {o.is_draft ? "Borrador" : "Sin bahía"}
                  </p>
                </button>
              ))}
            </div>
            {selected && (
              <Link
                className="mt-4 block text-xs text-blue underline"
                href={`/dashboard/servicios/${selected}`}
              >
                Abrir borrador seleccionado
              </Link>
            )}
          </aside>
        </div>
      )}
      <Modal
        open={!!slot}
        onClose={() => !busy && setSlot(null)}
        title="Nueva ODS"
        description={
          slot
            ? `${columns.find((b) => b.id === slot.bayId)?.name} · ${String(slot.hour).padStart(2, "0")}:00 · ${day}`
            : ""
        }
        size="md"
        closeDisabled={busy}
        footer={
          <button
            disabled={busy || !vehicle}
            onClick={() => void create()}
            className="rounded-full bg-blue px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Creando…" : "Crear borrador"}
          </button>
        }
      >
        {actionError && (
          <p role="alert" className="px-5 pt-4 text-sm text-red-700">
            {actionError}
          </p>
        )}
        <label className="block p-5 text-sm text-navy">
          Vehículo
          <select
            aria-label="Vehículo para la nueva ODS"
            value={vehicle}
            onChange={(e) => setVehicle(e.target.value)}
            className="mt-2 w-full rounded-xl border border-navy/15 p-3"
          >
            <option value="">Seleccionar vehículo</option>
            {Array.from(vehicleMap.values()).map((v) => (
              <option key={v.vehicle.id} value={v.vehicle.id}>
                {v.vehicle.brand} {v.vehicle.model} ·{" "}
                {v.vehicle.plate || "Sin placa"} · {v.client.full_name}
              </option>
            ))}
          </select>
        </label>
      </Modal>
    </div>
  );
}
