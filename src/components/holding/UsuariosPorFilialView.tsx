"use client";

import { useHoldingDashboardContext } from "@/contexts/HoldingDashboardContext";
import HoldingMetricTable, { type HoldingMetricColumn } from "./HoldingMetricTable";

const COLUMNS: HoldingMetricColumn[] = [
  { key: "activos", label: "Activos", align: "right", render: (r) => r.usuarios_activos },
  { key: "total", label: "Total", align: "right", render: (r) => <strong>{r.usuarios_total}</strong> },
];

export default function UsuariosPorFilialView() {
  const { data, loading, error, refresh } = useHoldingDashboardContext();

  return (
    <HoldingMetricTable
      title="Usuarios por Filial"
      description="Cuentas de usuario registradas en cada filial."
      columns={COLUMNS}
      rows={data?.filiales}
      loading={loading}
      error={error}
      onRetry={refresh}
    />
  );
}
