"use client";

import { useEffect, useState } from "react";
import { Phone } from "lucide-react";
import { getMaintenanceDue } from "@/lib/api/kpis";
import type { MaintenanceDueReport } from "@/types/kpis";

const WINDOWS = [30, 60, 90];

interface MaintenanceDueCardProps {
  filialId: string | null;
}

export default function MaintenanceDueCard({ filialId }: MaintenanceDueCardProps) {
  const [windowDays, setWindowDays] = useState(30);
  const [report, setReport] = useState<MaintenanceDueReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!filialId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    getMaintenanceDue(filialId, windowDays)
      .then(setReport)
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudo cargar el listado."))
      .finally(() => setLoading(false));
  }, [filialId, windowDays]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 pb-0">
        <div className="flex rounded-full border border-navy/15 p-1">
          {WINDOWS.map((w) => (
            <button
              key={w}
              onClick={() => setWindowDays(w)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                windowDays === w ? "bg-navy text-white" : "text-steel"
              }`}
            >
              {w} días
            </button>
          ))}
        </div>
        {report && (
          <span className="rounded-full bg-red-100 px-4 py-1.5 text-sm font-semibold text-red-700">
            {report.overdue_count} servicio{report.overdue_count === 1 ? "" : "s"} vencido
            {report.overdue_count === 1 ? "" : "s"} sin atender
          </span>
        )}
      </div>

      <div className="p-6">
        {loading ? (
          <div className="p-10 text-center text-sm text-steel">Cargando listado...</div>
        ) : error ? (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        ) : !report || report.rows.length === 0 ? (
          <p className="p-10 text-center text-sm text-steel">
            Ningún vehículo tiene mantenimiento por vencer en los próximos {windowDays} días.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-navy/10">
              <tr className="text-steel">
                <th className="pb-2 font-mono text-[10px] uppercase tracking-widest">Vehículo</th>
                <th className="pb-2 font-mono text-[10px] uppercase tracking-widest">Cliente</th>
                <th className="pb-2 font-mono text-[10px] uppercase tracking-widest">Teléfono</th>
                <th className="pb-2 font-mono text-[10px] uppercase tracking-widest">Vence</th>
                <th className="pb-2 text-right font-mono text-[10px] uppercase tracking-widest">En</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {report.rows.map((row) => (
                <tr key={row.vehicle_id}>
                  <td className="py-3">
                    <span className="font-semibold text-navy">{row.plate}</span>{" "}
                    <span className="text-steel">
                      · {row.brand} {row.model}
                    </span>
                  </td>
                  <td className="py-3 text-navy">{row.client_name}</td>
                  <td className="py-3">
                    <a
                      href={`tel:${row.phone_primary}`}
                      className="flex items-center gap-1.5 font-medium text-blue hover:text-navy"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      {row.phone_primary}
                    </a>
                  </td>
                  <td className="py-3 text-steel">{new Date(row.due_at).toLocaleDateString("es-VE")}</td>
                  <td className="py-3 text-right font-medium text-navy">{row.days_until_due} días</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
