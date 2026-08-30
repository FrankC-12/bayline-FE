import { apiFetch } from "./client";
import type { KpiReport } from "@/types/kpis";

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