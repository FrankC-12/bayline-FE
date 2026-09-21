"use client";

import { useHoldingDashboardContext } from "@/contexts/HoldingDashboardContext";
import HoldingMetricTable, { type HoldingMetricColumn } from "./HoldingMetricTable";

const COLUMNS: HoldingMetricColumn[] = [
  { key: "clientes", label: "# Clientes", align: "right", render: (r) => r.clientes },
];

export default function ClientesPorFilialView() {
  const { data, loading, error, refresh } = useHoldingDashboardContext();

  return (
    <HoldingMetricTable
      title="Clientes por Filial"
      description="Tamaño del catálogo de clientes de cada filial."
      columns={COLUMNS}
      rows={data?.filiales}
      loading={loading}
      error={error}
      onRetry={refresh}
    />
  );
}
