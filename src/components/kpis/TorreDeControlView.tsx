"use client";

import { useState } from "react";
import { Calendar, Trophy } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUsers } from "@/hooks/useUser";
import { getKpiReport, type KpiCategory } from "@/lib/api/kpis";
import type { KpiReport } from "@/types/kpis";

const TABS: { value: KpiCategory; label: string }[] = [
  { value: "tecnicos", label: "Técnicos" },
  { value: "asesores", label: "Asesores (ODS)" },
  { value: "almacenistas", label: "Almacenistas (ODT)" },
];

const TAB_METRIC_LABEL: Record<KpiCategory, string> = {
  tecnicos: "Tiempo promedio por ODS (creación → cierre)",
  asesores: "Tiempo promedio por ODS atendida (creación → cierre)",
  almacenistas: "Tiempo promedio por ODT despachada (creación → pedido)",
};

function formatHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export default function TorreDeControlView() {
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;
  const { users } = useUsers({ filialId });

  const [tab, setTab] = useState<KpiCategory>("tecnicos");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [report, setReport] = useState<KpiReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userName = (id: string) => users.find((u) => u.id === id)?.full_name ?? "Usuario desconocido";

  async function handleApply() {
    if (!filialId || !dateFrom || !dateTo) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getKpiReport(tab, filialId, dateFrom, dateTo);
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar las métricas.");
    } finally {
      setLoading(false);
    }
  }

  function handleTabChange(next: KpiCategory) {
    setTab(next);
    setReport(null);
    if (filialId && dateFrom && dateTo) {
      setLoading(true);
      getKpiReport(next, filialId, dateFrom, dateTo)
        .then(setReport)
        .finally(() => setLoading(false));
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-navy">Torre de Control del Taller</h1>
      <p className="mt-1 text-sm text-steel">Tiempos operativos del taller · promedios y ranking por persona</p>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div className="flex rounded-full border border-navy/15 p-1">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => handleTabChange(t.value)}
              className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                tab === t.value ? "bg-navy text-white" : "text-steel"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-end gap-3">
          <div>
            <label className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-steel">Desde</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-xl border border-navy/15 px-3 py-2 text-sm outline-none focus:border-blue"
            />
          </div>
          <div>
            <label className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-steel">Hasta</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-xl border border-navy/15 px-3 py-2 text-sm outline-none focus:border-blue"
            />
          </div>
          <button
            onClick={handleApply}
            disabled={!dateFrom || !dateTo || loading}
            className="rounded-xl bg-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-40"
          >
            Aplicar
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-navy/10 bg-white">
        {!dateFrom || !dateTo || (!report && !loading) ? (
          <div className="flex flex-col items-center justify-center gap-3 p-16 text-center">
            <div className="rounded-2xl bg-blue-light p-4">
              <Calendar className="h-6 w-6 text-blue" />
            </div>
            <p className="font-display text-lg font-bold text-navy">
              {!dateFrom || !dateTo ? "Selecciona un rango de fechas para ver las métricas" : "Sin resultados en este rango"}
            </p>
            <p className="text-sm text-steel">
              {!dateFrom || !dateTo
                ? 'Elige fecha "Desde" y "Hasta" arriba, luego presiona Aplicar.'
                : "No hay órdenes cerradas para esta categoría en las fechas elegidas."}
            </p>
          </div>
        ) : loading ? (
          <div className="p-16 text-center text-sm text-steel">Calculando métricas...</div>
        ) : report ? (
          <div className="p-6">
            <div className="mb-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-ash p-5">
                <p className="font-mono text-[11px] uppercase tracking-widest text-steel">{TAB_METRIC_LABEL[tab]}</p>
                <p className="mt-1 font-display text-2xl font-bold text-navy">{formatHours(report.overall_avg_hours)}</p>
              </div>
              <div className="rounded-xl bg-ash p-5">
                <p className="font-mono text-[11px] uppercase tracking-widest text-steel">Total en el período</p>
                <p className="mt-1 font-display text-2xl font-bold text-navy">{report.overall_count}</p>
              </div>
            </div>

            {report.rows.length === 0 ? (
              <p className="p-6 text-center text-sm text-steel">No hay datos para esta categoría en el rango elegido.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="border-b border-navy/10">
                  <tr className="text-steel">
                    <th className="pb-2 font-mono text-[10px] uppercase tracking-widest">#</th>
                    <th className="pb-2 font-mono text-[10px] uppercase tracking-widest">Persona</th>
                    <th className="pb-2 font-mono text-[10px] uppercase tracking-widest">Cantidad</th>
                    <th className="pb-2 text-right font-mono text-[10px] uppercase tracking-widest">Tiempo promedio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy/5">
                  {report.rows.map((row, i) => (
                    <tr key={row.user_id}>
                      <td className="py-3">
                        {i === 0 ? <Trophy className="h-4 w-4 text-amber-500" /> : <span className="text-steel">{i + 1}</span>}
                      </td>
                      <td className="py-3 font-semibold text-navy">{userName(row.user_id)}</td>
                      <td className="py-3 text-navy">{row.count}</td>
                      <td className="py-3 text-right font-medium text-navy">{formatHours(row.avg_hours)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : null}
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}