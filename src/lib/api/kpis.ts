import { apiFetch } from "./client";
import type { KpiReport, ManualMovementsRate, MaintenanceDueReport, ReworkReport, UpsellConversionRate } from "@/types/kpis";

export type KpiCategory = "tecnicos" | "asesores" | "almacenistas";

export async function getKpiReport(
  category: KpiCategory,
  filialId: string,
  dateFrom: string,
  dateTo: string
): Promise<KpiReport> {
  return apiFetch<KpiReport>(
    `/kpis/${category}?filial_id=${filialId}&date_from=${dateFrom}&date_to=${dateTo}`
  );
}

export async function getMaintenanceDue(
  filialId: string,
  windowDays: number
): Promise<MaintenanceDueReport> {
  return apiFetch<MaintenanceDueReport>(
    `/kpis/mantenimientos-por-vencer?filial_id=${filialId}&window_days=${windowDays}`
  );
}

export async function getReworkReport(
  filialId: string,
  dateFrom: string,
  dateTo: string
): Promise<ReworkReport> {
  return apiFetch<ReworkReport>(
    `/kpis/retrabajo?filial_id=${filialId}&date_from=${dateFrom}&date_to=${dateTo}`
  );
}

export async function getManualMovementsRate(
  filialId: string,
  dateFrom: string,
  dateTo: string
): Promise<ManualMovementsRate> {
  return apiFetch<ManualMovementsRate>(
    `/kpis/movimientos-manuales?filial_id=${filialId}&date_from=${dateFrom}&date_to=${dateTo}`
  );
}

export async function getUpsellConversionRate(
  filialId: string,
  dateFrom: string,
  dateTo: string
): Promise<UpsellConversionRate> {
  return apiFetch<UpsellConversionRate>(
    `/kpis/conversion-upsells?filial_id=${filialId}&date_from=${dateFrom}&date_to=${dateTo}`
  );
}