"use client";

import { useHoldingDashboardContext } from "@/contexts/HoldingDashboardContext";
import HoldingMetricTable, { type HoldingMetricColumn } from "./HoldingMetricTable";

const usd = (value: number) => `$${value.toLocaleString("es-VE", { minimumFractionDigits: 2 })}`;

const COLUMNS: HoldingMetricColumn[] = [
  { key: "count", label: "# Ventas", align: "right", render: (r) => r.ventas_repuestos.count },
  { key: "total", label: "Total (USD)", align: "right", render: (r) => usd(r.ventas_repuestos.total_usd) },
];

export default function VentasRepuestosPorFilialView() {
  const { data, loading, error, refresh } = useHoldingDashboardContext();

  return (
    <HoldingMetricTable
      title="Ventas de Repuestos por Filial"
      description="Ventas de mostrador de repuestos por filial (el total excluye ventas canceladas)."
      columns={COLUMNS}
      rows={data?.filiales}
      loading={loading}
      error={error}
      onRetry={refresh}
    />
  );
}
