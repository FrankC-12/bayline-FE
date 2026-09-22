import { apiFetch } from "./client";

export interface OdsSummary {
  total: number;
  pendiente: number;
  en_progreso: number;
  completado: number;
  orden_cerrada: number;
  cancelado: number;
}

export interface OdtSummary {
  total: number;
  pendiente: number;
  pedido: number;
  completado: number;
}

export interface SalesSummary {
  count: number;
  total_usd: number;
}

export interface FilialDashboardRow {
  filial_id: string;
  filial_name: string;
  ods: OdsSummary;
  odt: OdtSummary;
  ventas_repuestos: SalesSummary;
  ventas_vehiculos: SalesSummary;
  clientes: number;
  usuarios_total: number;
  usuarios_activos: number;
  almacenes_total: number;
  almacenes_activos: number;
}

export interface HoldingDashboardReport {
  holding_id: string;
  filiales: FilialDashboardRow[];
}

export function getHoldingDashboard(holdingId: string): Promise<HoldingDashboardReport> {
  return apiFetch<HoldingDashboardReport>(`/holdings/${holdingId}/dashboard`);
}
