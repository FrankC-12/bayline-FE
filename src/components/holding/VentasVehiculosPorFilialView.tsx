"use client";

import { useHoldingDashboardContext } from "@/contexts/HoldingDashboardContext";
import HoldingMetricTable, { type HoldingMetricColumn } from "./HoldingMetricTable";

const usd = (value: number) => `$${value.toLocaleString("es-VE", { minimumFractionDigits: 2 })}`;

const COLUMNS: HoldingMetricColumn[] = [
  { key: "count", label: "# Ventas", align: "right", render: (r) => r.ventas_vehiculos.count },
  { key: "total", label: "Total (USD)", align: "right", render: (r) => usd(r.ventas_vehiculos.total_usd) },
];

export default function VentasVehiculosPorFilialView() {
  const { data, loading, error, refresh } = useHoldingDashboardContext();

  return (
    <HoldingMetricTable
      title="Ventas de Vehículos por Filial"
      description="Vehículos vendidos en el concesionario de cada filial."
      columns={COLUMNS}
      rows={data?.filiales}
      loading={loading}
      error={error}
      onRetry={refresh}
    />
  );
}
