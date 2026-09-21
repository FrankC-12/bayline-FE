export interface KpiRow {
  user_id: string;
  count: number;
  avg_hours: number;
}

export interface KpiReport {
  rows: KpiRow[];
  overall_count: number;
  overall_avg_hours: number;
}

export interface MaintenanceDueRow {
  vehicle_id: string;
  plate: string | null;
  brand: string;
  model: string;
  client_id: string;
  client_name: string;
  phone_primary: string;
  phone_secondary: string | null;
  due_at: string;
  days_until_due: number;
}

export interface MaintenanceDueReport {
  window_days: number;
  rows: MaintenanceDueRow[];
  overdue_count: number;
}

export interface ReworkTechnicianRow {
  user_id: string;
  invoiced_orders_count: number;
  claims_count: number;
  rework_rate: number;
  avg_days_to_claim: number | null;
}

export interface ReworkServiceRow {
  tempario_id: string;
  tempario_name: string;
  claims_count: number;
  avg_days_to_claim: number | null;
}

export interface ReworkPartRow {
  part_id: string;
  part_name: string;
  claims_count: number;
  avg_days_to_claim: number | null;
}

export interface ReworkReport {
  invoiced_orders_count: number;
  orders_with_claim_count: number;
  rework_rate: number;
  avg_days_to_claim: number | null;
  quick_claims_count: number;
  slow_claims_count: number;
  by_technician: ReworkTechnicianRow[];
  by_service: ReworkServiceRow[];
  by_part: ReworkPartRow[];
}

export interface ManualMovementsRate {
  total_count: number;
  manual_count: number;
  rate: number;
}