"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowRight,
  CarFront,
  CheckCheck,
  ClipboardList,
  RefreshCw,
  CalendarClock,
} from "lucide-react";
import { getWorkshopOverview } from "@/lib/api/kpis";
import type { WorkshopOverview } from "@/types/kpis";
import { formatCount, formatEntryDate } from "@/lib/format";
import ErrorState from "@/components/common/ErrorState";
export default function WorkshopOverviewPanel({
  filialId,
  onMaintenance,
}: {
  filialId: string | null;
  onMaintenance: () => void;
}) {
  const [report, setReport] = useState<WorkshopOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const request = useRef(0);
  const load = useCallback(async () => {
    const id = ++request.current;
    if (!filialId) {
      setReport(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getWorkshopOverview(filialId);
      if (id === request.current) setReport(data);
    } catch (err) {
      if (id === request.current)
        setError(
          err instanceof Error ? err.message : "No se pudo cargar el resumen.",
        );
    } finally {
      if (id === request.current) setLoading(false);
    }
  }, [filialId]);
  useEffect(() => {
    setReport(null);
    void load();
    const sequence = request;
    return () => {
      sequence.current++;
    };
  }, [load]);
  if (loading && !report)
    return (
      <div role="status" className="mt-6 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-2xl border border-navy/10 bg-white"
            />
          ))}
        </div>
        <div className="h-72 animate-pulse rounded-2xl border border-navy/10 bg-white" />
        <span className="sr-only">Cargando resumen del taller</span>
      </div>
    );
  if (error)
    return (
      <div className="mt-6 rounded-2xl border border-navy/10 bg-white">
        <ErrorState
          error={{ kind: "unknown", message: error }}
          onRetry={() => void load()}
        />
      </div>
    );
  if (!report) return null;
  const cards = [
    {
      label: "ODS activas",
      value: report.active_orders,
      note: "Pendientes, en progreso y completadas",
      icon: ClipboardList,
      color: "bg-blue-light text-blue",
    },
    {
      label: "En progreso",
      value: report.in_progress_orders,
      note: "Trabajo en curso en el taller",
      icon: Activity,
      color: "bg-amber-50 text-amber-700",
    },
    {
      label: "Trabajo completado",
      value: report.ready_orders,
      note: "Pendientes de cierre o entrega",
      icon: CheckCheck,
      color: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Vehículos registrados",
      value: report.registered_vehicles,
      note: "Vehículos de clientes de esta filial",
      icon: CarFront,
      color: "bg-slate-100 text-navy",
    },
  ];
  const stages = [
    { label: "Pendientes", value: report.pending_orders, color: "#e7a021" },
    {
      label: "En progreso",
      value: report.in_progress_orders,
      color: "#2b59b3",
    },
    {
      label: "Trabajo completado",
      value: report.ready_orders,
      color: "#12966e",
    },
  ];
  const peak = Math.max(
    1,
    ...report.trend.flatMap((day) => [day.created, day.delivered]),
  );
  const created = report.trend.reduce((sum, day) => sum + day.created, 0);
  const delivered = report.trend.reduce((sum, day) => sum + day.delivered, 0);
  let offset = 0;
  return (
    <div className="mt-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-navy">Panorama del taller</h2>
          <p className="mt-1 text-xs text-steel">
            {formatEntryDate(report.as_of)} · Datos de esta filial
          </p>
        </div>
        <button
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full border border-navy/15 bg-white px-4 py-2 text-xs font-semibold text-navy disabled:opacity-50"
        >
          <RefreshCw
            aria-hidden="true"
            className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
          />
          Actualizar
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, note, icon: Icon, color }) => (
          <section
            key={label}
            className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-medium text-steel">{label}</h3>
              <span className={`rounded-xl p-2 ${color}`}>
                <Icon aria-hidden="true" className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 font-display text-3xl font-bold tracking-tight text-navy">
              {formatCount(value)}
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-steel">
              {note}
            </p>
          </section>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-5">
        <figure className="min-w-0 rounded-2xl border border-navy/10 bg-white p-5 lg:col-span-3">
          <figcaption className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-navy">
                Actividad de los últimos 7 días
              </h3>
              <p className="mt-1 text-xs text-steel">
                {formatCount(created)} ODS creadas · {formatCount(delivered)}{" "}
                vehículos entregados
              </p>
            </div>
            <div className="flex gap-3 text-[10px] text-steel">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-blue" />
                Creadas
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-emerald-500" />
                Entregados
              </span>
            </div>
          </figcaption>
          <div className="relative mt-7">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 flex h-40 flex-col justify-between"
            >
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className="border-t border-dashed border-navy/10"
                />
              ))}
            </div>
            <div className="relative grid grid-cols-7 gap-2">
              {report.trend.map((day) => (
                <div key={day.day} className="min-w-0 text-center">
                  <div
                    role="img"
                    aria-label={`${formatEntryDate(day.day)}: ${day.created} ODS creadas y ${day.delivered} vehículos entregados`}
                    title={`${formatEntryDate(day.day)} · Creadas: ${day.created} · Entregados: ${day.delivered}`}
                    className="flex h-40 items-end justify-center gap-1.5"
                  >
                    {[
                      { value: day.created, color: "bg-blue" },
                      { value: day.delivered, color: "bg-emerald-500" },
                    ].map((bar, index) => (
                      <div
                        key={index}
                        className={`relative w-3.5 max-w-[40%] rounded-t-md ${bar.color}`}
                        style={{ height: `${(bar.value / peak) * 100}%` }}
                      >
                        {bar.value > 0 && (
                          <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-navy">
                            {formatCount(bar.value)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-[10px] text-steel">
                    {new Date(`${day.day}T12:00:00-04:00`).toLocaleDateString(
                      "es-VE",
                      {
                        day: "numeric",
                        month: "short",
                        timeZone: "America/Caracas",
                      },
                    )}
                  </p>
                </div>
              ))}
            </div>
            {created + delivered === 0 && (
              <div className="pointer-events-none absolute inset-x-4 top-8 rounded-xl border border-navy/5 bg-white/95 p-4 text-center">
                <p className="text-sm font-medium text-navy">
                  Sin actividad registrada en estos días
                </p>
                <p className="mt-1 text-xs text-steel">
                  Las nuevas ODS y entregas aparecerán aquí.
                </p>
              </div>
            )}
          </div>
          <p className="mt-4 text-[10px] text-steel">
            Días de Venezuela · No incluye borradores.
          </p>
        </figure>
        <figure className="rounded-2xl border border-navy/10 bg-white p-5 lg:col-span-2">
          <figcaption>
            <h3 className="font-semibold text-navy">
              Estado de las ODS activas
            </h3>
            <p className="mt-1 text-xs text-steel">
              Distribución actual del trabajo
            </p>
          </figcaption>
          <div className="relative mx-auto my-5 h-36 w-36">
            <svg
              viewBox="0 0 120 120"
              role="img"
              aria-label={`${report.active_orders} ODS activas: ${report.pending_orders} pendientes, ${report.in_progress_orders} en progreso, ${report.ready_orders} con trabajo completado`}
              className="h-full w-full -rotate-90"
            >
              <circle
                cx="60"
                cy="60"
                r="48"
                fill="none"
                stroke="#eef1f5"
                strokeWidth="12"
              />
              {stages.map((stage) => {
                const percentage = report.active_orders
                  ? (stage.value / report.active_orders) * 100
                  : 0;
                const current = offset;
                offset += percentage;
                return percentage > 0 ? (
                  <circle
                    key={stage.label}
                    cx="60"
                    cy="60"
                    r="48"
                    fill="none"
                    stroke={stage.color}
                    strokeWidth="12"
                    pathLength="100"
                    strokeDasharray={`${percentage} ${100 - percentage}`}
                    strokeDashoffset={-current}
                  />
                ) : null;
              })}
            </svg>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
            >
              <p className="font-display text-3xl font-bold text-navy">
                {formatCount(report.active_orders)}
              </p>
              <p className="text-[10px] text-steel">ODS activas</p>
            </div>
          </div>
          <dl className="space-y-2 text-xs">
            {stages.map((stage) => (
              <div
                key={stage.label}
                className="flex items-center justify-between"
              >
                <dt className="flex items-center gap-2 text-steel">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: stage.color }}
                  />
                  {stage.label}
                </dt>
                <dd className="font-semibold text-navy">
                  {formatCount(stage.value)}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 border-t border-navy/5 pt-3 text-[10px] text-steel">
            {formatCount(report.draft_orders)} borradores · Cerradas y
            canceladas excluidas.
          </p>
        </figure>
      </div>
      <section className="rounded-2xl border border-navy/10 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-blue-light p-2 text-blue">
              <CalendarClock aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-semibold text-navy">
                Seguimiento de mantenimiento
              </h3>
              <p className="mt-1 text-xs text-steel">
                Próximas visitas sugeridas registradas en los vehículos
              </p>
            </div>
          </div>
          <button
            onClick={onMaintenance}
            className="inline-flex items-center gap-2 rounded-full border border-navy/15 px-4 py-2 text-xs font-semibold text-blue"
          >
            Ver mantenimientos
            <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            {
              label: "Vencidos sin atender",
              value: report.maintenance_overdue,
              note: "Con fecha sugerida anterior a hoy",
              style:
                report.maintenance_overdue > 0
                  ? "bg-amber-50 text-amber-800"
                  : "bg-emerald-50 text-emerald-800",
            },
            {
              label: "Vencen en 7 días",
              value: report.maintenance_due_7,
              note: "Prioridad para contactar",
              style: "bg-slate-50 text-navy",
            },
            {
              label: "Vencen en 30 días",
              value: report.maintenance_due_30,
              note: "Incluye los próximos 7 días",
              style: "bg-blue-light/60 text-navy",
            },
          ].map((item) => (
            <div key={item.label} className={`rounded-xl p-4 ${item.style}`}>
              <p className="text-xs font-medium">{item.label}</p>
              <p className="mt-2 font-display text-2xl font-bold">
                {formatCount(item.value)}
              </p>
              <p className="mt-1 text-[10px] opacity-80">{item.note}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
