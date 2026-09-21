"use client";

import { useHoldingDashboardContext } from "@/contexts/HoldingDashboardContext";
import HoldingMetricTable, { type HoldingMetricColumn } from "./HoldingMetricTable";

const COLUMNS: HoldingMetricColumn[] = [
  { key: "pendiente", label: "Pendiente", align: "right", render: (r) => r.ods.pendiente },
  { key: "en_progreso", label: "En progreso", align: "right", render: (r) => r.ods.en_progreso },
  { key: "completado", label: "Completado", align: "right", render: (r) => r.ods.completado },
  { key: "orden_cerrada", label: "Orden cerrada", align: "right", render: (r) => r.ods.orden_cerrada },
  { key: "cancelado", label: "Cancelado", align: "right", render: (r) => r.ods.cancelado },
  { key: "total", label: "Total", align: "right", render: (r) => <strong>{r.ods.total}</strong> },
];

export default function OdsPorFilialView() {
  const { data, loading, error, refresh } = useHoldingDashboardContext();

  return (
    <HoldingMetricTable
      title="Órdenes de Servicio por Filial"
      description="Cuántas ODS tiene cada filial, por estado."
      columns={COLUMNS}
      rows={data?.filiales}
      loading={loading}
      error={error}
      onRetry={refresh}
    />
  );
}
