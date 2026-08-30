"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Search, Trash2 } from "lucide-react";
import { useTemparios } from "@/hooks/useTemparios";
import type { ServiceOrderTask } from "@/types/serviceOrder";

interface TasksCardProps {
  filialId: string;
  tasks: ServiceOrderTask[];
  onAdd: (temparioId: string) => Promise<void>;
  onToggleStatus: (taskId: string, status: "pendiente" | "completada") => Promise<void>;
  onRemove: (taskId: string) => Promise<void>;
}

export default function TasksCard({ filialId, tasks, onAdd, onToggleStatus, onRemove }: TasksCardProps) {
  const [search, setSearch] = useState("");
  const { temparios } = useTemparios(filialId, search || undefined);
  const [adding, setAdding] = useState(false);

  const results = search ? temparios.slice(0, 6) : [];

  async function handleAdd(temparioId: string) {
    setAdding(true);
    try {
      await onAdd(temparioId);
      setSearch("");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="rounded-2xl border border-navy/10 bg-white p-6">
      <h3 className="mb-1 font-display text-lg font-bold text-navy">Tareas a realizar</h3>
      <p className="mb-4 text-sm text-steel">
        Los repuestos de cada tempario vinculado a tu catálogo se agregan solos a la ODT.
      </p>

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          disabled={adding}
          placeholder="Agregar tarea — código (MP-501) o nombre..."
          className="w-full rounded-xl border border-navy/15 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20 disabled:opacity-60"
        />
        {results.length > 0 && (
          <div className="absolute z-10 mt-1 w-full divide-y divide-navy/5 rounded-xl border border-navy/10 bg-white shadow-lg">
            {results.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleAdd(t.id)}
                className="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-ash"
              >
                <span>
                  <span className="font-mono text-blue">{t.code}</span>{" "}
                  <span className="text-navy">{t.name}</span>
                </span>
                <span className="text-xs text-steel">{t.estimated_hours} h</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {tasks.length === 0 ? (
        <p className="rounded-xl bg-ash px-4 py-6 text-center text-sm text-steel">
          Todavía no hay tareas agregadas a esta orden.
        </p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="border-b border-navy/10">
            <tr>
              <th className="py-2 font-mono text-[11px] uppercase tracking-widest text-steel">Tarea</th>
              <th className="py-2 font-mono text-[11px] uppercase tracking-widest text-steel">Código</th>
              <th className="py-2 font-mono text-[11px] uppercase tracking-widest text-steel">Horas</th>
              <th className="py-2 font-mono text-[11px] uppercase tracking-widest text-steel">Estado</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {tasks.map((task) => (
              <tr key={task.id}>
                <td className="py-2.5 font-medium text-navy">{task.name_snapshot}</td>
                <td className="py-2.5 font-mono text-blue">{task.code_snapshot}</td>
                <td className="py-2.5 text-navy">{task.hours_snapshot} h</td>
                <td className="py-2.5">
                  <button
                    type="button"
                    onClick={() =>
                      onToggleStatus(
                        task.id,
                        task.status === "pendiente" ? "completada" : "pendiente"
                      )
                    }
                    className={`flex items-center gap-1.5 text-xs font-semibold ${
                      task.status === "completada" ? "text-emerald-600" : "text-amber-600"
                    }`}
                  >
                    {task.status === "completada" ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <Circle className="h-3.5 w-3.5" />
                    )}
                    {task.status === "completada" ? "Completada" : "Pendiente"}
                  </button>
                </td>
                <td className="py-2.5 text-right">
                  <button
                    type="button"
                    onClick={() => onRemove(task.id)}
                    aria-label="Quitar tarea"
                    className="rounded-lg p-1.5 text-steel hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}