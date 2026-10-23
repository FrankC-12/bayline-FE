"use client";

import { formatMoney, formatCount } from "@/lib/format";
import { formatDuration, taskTimerElapsedSeconds } from "@/lib/time";
import { useEffect, useState, type ReactNode } from "react";
import { Search, Trash2 } from "lucide-react";
import { useTemparios } from "@/hooks/useTemparios";
import Modal from "@/components/common/Modal";
import {
  quoteOrderTempario,
  type TemparioQuote,
} from "@/lib/api/temparioPricing";
import type { Tempario } from "@/types/tempario";
import type {
  ServiceOrderTask,
  ServiceOrderPayer,
  TaskStatus,
} from "@/types/serviceOrder";

const STATUS_LABELS: Record<TaskStatus, string> = {
  pendiente: "Pendiente",
  en_espera_de_repuestos: "Esperando repuestos",
  en_progreso: "En progreso",
  completada: "Completada",
  cancelada: "Cancelada",
};
const STATUS_STYLES: Record<TaskStatus, string> = {
  pendiente: "bg-amber-50 text-amber-600",
  en_espera_de_repuestos: "bg-orange-50 text-orange-600",
  en_progreso: "bg-blue-light text-blue",
  completada: "bg-emerald-50 text-emerald-600",
  cancelada: "bg-slate-100 text-slate-500",
};

interface TasksCardProps {
  filialId: string;
  orderId: string;
  readOnly?: boolean;
  tasks: ServiceOrderTask[];
  onAdd: (
    temparioId: string,
    payer: ServiceOrderPayer,
    expectedTotal?: number,
  ) => Promise<void>;
  onRemove: (taskId: string) => Promise<void>;
  children?: ReactNode;
}

function TaskTimerCell({ task }: { task: ServiceOrderTask }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!task.timer_started_at) return;
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, [task.timer_started_at]);
  return (
    <span className="font-mono text-[11px] text-steel">
      {formatDuration(taskTimerElapsedSeconds(task))}
    </span>
  );
}

export default function TasksCard({
  filialId,
  orderId,
  tasks,
  onAdd,
  onRemove,
  children,
  readOnly = false,
}: TasksCardProps) {
  const [search, setSearch] = useState("");
  const { temparios } = useTemparios(filialId, search || undefined);
  const [adding, setAdding] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [candidate, setCandidate] = useState<Tempario | null>(null);
  const [quote, setQuote] = useState<TemparioQuote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoteRevision, setQuoteRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setQuote(null);
    setQuoteError(null);
    if (candidate)
      quoteOrderTempario(orderId, candidate.id)
        .then((value) => {
          if (active) setQuote(value);
        })
        .catch((err) => {
          if (active)
            setQuoteError(
              err instanceof Error
                ? err.message
                : "No se pudo cotizar el servicio.",
            );
        });
    return () => {
      active = false;
    };
  }, [candidate, orderId, quoteRevision]);
  const results = search ? temparios.slice(0, 6) : [];

  async function handleAdd(temparioId: string) {
    if (readOnly) return;
    setAdding(true);
    setActionError(null);
    try {
      await onAdd(temparioId, "cliente", quote?.total_with_iva);
      setCandidate(null);
      setSearch("");
    } catch (e) {
      setActionError(
        e instanceof Error ? e.message : "No se pudo agregar la tarea.",
      );
      setQuoteRevision((value) => value + 1);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="rounded-2xl border border-navy/10 bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-sm font-bold text-navy">Tareas</h3>
        <span className="text-[11px] text-steel">
          {tasks.filter((t) => t.status === "completada").length} de{" "}
          {tasks.length} completadas
        </span>

        <div className="w-full">
          <div className="flex-1">
            <label htmlFor="ods-task-search" className="sr-only">
              Buscar tarea
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" />
              <input
                id="ods-task-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                disabled={adding || readOnly}
                placeholder="Agregar tarea — código (MP-501) o nombre..."
                className="w-full rounded-xl border border-navy/15 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20 disabled:opacity-60"
              />
              {!readOnly && results.length > 0 && (
                <div className="absolute z-10 mt-1 w-full divide-y divide-navy/5 rounded-xl border border-navy/10 bg-white shadow-lg">
                  {results.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      disabled={readOnly || adding}
                      onClick={() => {
                        setActionError(null);
                        setCandidate(t);
                      }}
                      className="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-ash"
                    >
                      <span>
                        <span className="font-mono text-blue">{t.code}</span>{" "}
                        <span className="text-navy">{t.name}</span>
                      </span>
                      <span className="text-xs text-steel">
                        {formatCount(t.estimated_hours)} h
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {actionError && (
        <p
          role="alert"
          className="mb-3 rounded-lg bg-red-50 p-3 text-xs text-red-700"
        >
          {actionError}
        </p>
      )}
      {tasks.length === 0 ? (
        <p className="rounded-xl bg-ash px-4 py-6 text-center text-sm text-steel">
          Todavía no hay tareas agregadas a esta orden.
        </p>
      ) : (
        <ul className="divide-y divide-navy/10">
          {tasks.map((task) => (
            <li key={task.id} className="py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-navy">
                    {task.name_snapshot}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-steel">
                    <span className="font-mono text-blue">
                      {task.code_snapshot}
                    </span>
                    <span>{formatCount(task.hours_snapshot)} h</span>
                    <TaskTimerCell task={task} />
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-lg px-2 py-1 text-[10px] font-semibold ${STATUS_STYLES[task.status]}`}
                  >
                    {STATUS_LABELS[task.status]}
                  </span>
                  {!readOnly && task.status === "pendiente" && (
                    <button
                      type="button"
                      disabled={adding}
                      onClick={() => {
                        setActionError(null);
                        void onRemove(task.id).catch((e) =>
                          setActionError(
                            e instanceof Error
                              ? e.message
                              : "No se pudo quitar la tarea.",
                          ),
                        );
                      }}
                      aria-label={`Quitar tarea ${task.name_snapshot}`}
                      className="rounded-lg p-1 text-steel hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      {candidate && (
        <Modal
          open={true}
          title={`Agregar ${candidate.code} · ${candidate.name}`}
          description="Cotización con la tarifa, el IVA y el margen guardados en esta ODS"
          onClose={() => setCandidate(null)}
          closeDisabled={adding}
          size="md"
          footer={
            <button
              type="button"
              onClick={() => void handleAdd(candidate.id)}
              disabled={
                adding || readOnly || !quote || !!quote.pricing_warnings.length
              }
              className="rounded-full bg-blue px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {adding ? "Agregando…" : "Confirmar servicio y repuestos"}
            </button>
          }
        >
          <div className="space-y-4 p-6">
            {quote ? (
              <>
                <dl className="space-y-3 rounded-xl bg-blue-light p-4 text-sm">
                  {[
                    {
                      label: "Costo de repuestos FIFO",
                      value: quote.parts_cost,
                    },
                    { label: "Margen de esta ODS", value: quote.parts_margin },
                    { label: "Mano de obra", value: quote.labor_cost },
                    {
                      label: `IVA (${formatCount(quote.iva_percentage)} %)`,
                      value: quote.iva_amount,
                    },
                    { label: "Total con IVA", value: quote.total_with_iva },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex justify-between gap-3"
                    >
                      <dt>{item.label}</dt>
                      <dd className="font-semibold tabular-nums">
                        ${formatMoney(item.value)}
                      </dd>
                    </div>
                  ))}
                </dl>
                <p className="text-xs leading-relaxed text-steel">
                  El catálogo muestra una referencia con valores actuales. Esta
                  cotización respeta los parámetros de la orden y los lotes
                  disponibles. Si el precio cambia antes de confirmar, tendrás
                  que revisarlo nuevamente.
                </p>
                {quote.pricing_notes?.map((note) => (
                  <p
                    key={note}
                    className="rounded-xl bg-slate-50 p-3 text-xs text-steel"
                  >
                    {note}
                  </p>
                ))}
                {quote.pricing_warnings.map((warning) => (
                  <p
                    key={warning}
                    className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900"
                  >
                    {warning}
                  </p>
                ))}
              </>
            ) : (
              <p role="status" className="text-sm text-steel">
                {quoteError || "Cotizando servicio…"}
              </p>
            )}
            {(quoteError || actionError) && (
              <button
                type="button"
                onClick={() => setQuoteRevision((value) => value + 1)}
                className="text-sm font-semibold text-blue underline"
              >
                Actualizar cotización
              </button>
            )}
            {actionError && (
              <p
                role="alert"
                className="rounded-xl bg-red-50 p-3 text-sm text-red-800"
              >
                {actionError}
              </p>
            )}
          </div>
        </Modal>
      )}
      {children}
    </div>
  );
}
