"use client";

import { useHoldingDashboardContext } from "@/contexts/HoldingDashboardContext";
import HoldingMetricTable, { type HoldingMetricColumn } from "./HoldingMetricTable";

const COLUMNS: HoldingMetricColumn[] = [
  { key: "activos", label: "Activos", align: "right", render: (r) => r.almacenes_activos },
  { key: "total", label: "Total", align: "right", render: (r) => <strong>{r.almacenes_total}</strong> },
];

export default function AlmacenesPorFilialView() {
  const { data, loading, error, refresh } = useHoldingDashboardContext();

  return (
    <HoldingMetricTable
      title="Almacenes por Filial"
      description="Almacenes registrados en cada filial."
      columns={COLUMNS}
      rows={data?.filiales}
      loading={loading}
      error={error}
      onRetry={refresh}
    />
  );
}
