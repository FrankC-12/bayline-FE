import type { ReactNode } from "react";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import type { ListErrorInfo } from "@/lib/api/listError";
import type { FilialDashboardRow } from "@/lib/api/holdingDashboard";

export interface HoldingMetricColumn {
  key: string;
  label: string;
  align?: "left" | "right";
  render: (row: FilialDashboardRow) => ReactNode;
}

interface HoldingMetricTableProps {
  title: string;
  description: string;
  columns: HoldingMetricColumn[];
  rows: FilialDashboardRow[] | undefined;
  loading: boolean;
  error: ListErrorInfo | null;
  onRetry: () => void;
}

/** Shared shell for every "one KPI area, broken down per filial" page in the
 * Holding sidebar — same loading/error/empty states as the rest of the app,
 * just with a caller-defined set of columns over the shared dashboard rows. */
export default function HoldingMetricTable({
  title,
  description,
  columns,
  rows,
  loading,
  error,
  onRetry,
}: HoldingMetricTableProps) {
  return (
    <div>
      <div className="mb-8">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-blue">Holding</span>
        <h1 className="mt-2 font-display text-3xl font-bold text-navy">{title}</h1>
        <p className="mt-1 text-sm text-steel">{description}</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
        {loading ? (
          <div className="p-12 text-center text-sm text-steel">Cargando...</div>
        ) : error ? (
          <ErrorState error={error} onRetry={onRetry} />
        ) : !rows || rows.length === 0 ? (
          <EmptyState compact title="Esta filial todavía no tiene datos que mostrar." />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-navy/10 bg-ash">
              <tr>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Filial</th>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel ${
                      col.align === "right" ? "text-right" : "text-left"
                    }`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {rows.map((row) => (
                <tr key={row.filial_id} className="transition hover:bg-ash/60">
                  <td className="px-6 py-4 font-semibold text-navy">{row.filial_name}</td>
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-6 py-4 text-navy ${col.align === "right" ? "text-right" : "text-left"}`}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
