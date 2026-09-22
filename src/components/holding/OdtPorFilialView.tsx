"use client";

import { useHoldingDashboardContext } from "@/contexts/HoldingDashboardContext";
import HoldingMetricTable, { type HoldingMetricColumn } from "./HoldingMetricTable";

const COLUMNS: HoldingMetricColumn[] = [
  { key: "pendiente", label: "Pendiente", align: "right", render: (r) => r.odt.pendiente },
  { key: "pedido", label: "Pedido", align: "right", render: (r) => r.odt.pedido },
  { key: "completado", label: "Completado", align: "right", render: (r) => r.odt.completado },
  { key: "total", label: "Total", align: "right", render: (r) => <strong>{r.odt.total}</strong> },
];

export default function OdtPorFilialView() {
  const { data, loading, error, refresh } = useHoldingDashboardContext();

  return (
    <HoldingMetricTable
      title="Despachos (ODT) por Filial"
      description="Repuestos pedidos a almacén dentro de cada ODS, por estado de despacho."
      columns={COLUMNS}
      rows={data?.filiales}
      loading={loading}
      error={error}
      onRetry={refresh}
    />
  );
}
