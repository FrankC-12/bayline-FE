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