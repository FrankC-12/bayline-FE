import { apiFetch } from "./client";
export type Section =
  | "tesoreria"
  | "comercial"
  | "inventario"
  | "taller"
  | "contabilidad"
  | "actividad";
export type Cell = string | number | boolean | null;
export type Row = Record<string, unknown>;
export interface Column {
  key: string;
  label: string;
  format: "money" | "number" | "date" | "datetime" | "text" | "status";
}
export interface ControlReport {
  section: Section;
  generated_at: string;
  date_from: string;
  date_to: string;
  filiales: { id: string; name: string }[];
  metrics: {
    label: string;
    value: Cell;
    format: "money" | "number" | "percent" | "text";
    currency: string;
    note: string;
  }[];
  tables: { title: string; columns: Column[]; rows: Row[]; note: string }[];
  notes: string[];
}
export function getHoldingControl(
  id: string,
  section: Section,
  from: string,
  to: string,
  filial?: string,
) {
  const params = new URLSearchParams({ date_from: from, date_to: to });
  if (filial) params.set("filial_id", filial);
  return apiFetch<ControlReport>(
    `/holdings/${id}/control/${section}?${params}`,
  );
}
export function registerHolding(
  id: string,
  payload: {
    request_id: string;
    entry_date: string;
    record: Record<string, unknown>;
  },
) {
  return apiFetch(`/holdings/${id}/registers`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
