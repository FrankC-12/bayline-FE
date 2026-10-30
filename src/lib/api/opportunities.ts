import { apiFetch } from "./client";
export interface SalesWorkflow {
  enabled: boolean;
  required_documents: Record<string, string>;
  closing_files: Record<string, string>;
  files: Record<
    string,
    { filename: string; uploaded_at: string; download_url: string }
  >;
  financing_status?: string;
  provider?: string;
  external_reference?: string;
  decision_reference?: string;
  insurer?: string;
  policy_number?: string;
  delivery?: Record<string, boolean>;
  delivery_ready: boolean;
  pdi: null | {
    id: string;
    code: string;
    status: string;
    is_draft: boolean;
    ready: boolean;
  };
  deposit?: {
    amount: number;
    currency: string;
    status: string;
    retention_percentage: number;
    retained_amount?: number;
    refunded_amount?: number;
    reference: string;
    income_id: string;
  };
}
export interface Opportunity {
  workflow?: SalesWorkflow;
  id: string;
  code: string;
  client_id: string | null;
  client_name: string;
  client_phone: string | null;
  client_document: string | null;
  advisor_user_id: string | null;
  advisor_name: string | null;
  origin: string;
  stage: string;
  vehicle_id: string | null;
  vehicle_label: string | null;
  vehicle_status: string | null;
  sale_id: string | null;
  amount: number | null;
  currency: string;
  quoted_amount: number | null;
  quoted_at: string | null;
  quote_expires_at?: string | null;
  discount_percentage?: number;
  sale_type: string;
  notes: string | null;
  next_contact_at: string | null;
  lost_reason: string | null;
  version: number;
  activity: {
    action: string;
    at: string;
    note: string | null;
    actor_id: string | null;
  }[];
  created_at: string;
  delivered_at: string | null;
}
export interface OpportunityBoard {
  items: Opportunity[];
  total: number;
  page: number;
  total_pages: number;
  counts: Record<string, number>;
}
export const STAGES: Record<string, string> = {
  prospecto: "Prospecto",
  cotizada: "Cotizada",
  reservada: "Reservada",
  financiamiento: "Financiamiento",
  facturada: "Facturada",
  entregada: "Entregada",
  perdida: "Perdida",
};
export const listOpportunities = (
  filial: string,
  search: string,
  advisor: string,
  page = 1,
) => {
  const q = new URLSearchParams({
    filial_id: filial,
    page: String(page),
    page_size: "100",
  });
  if (search) q.set("search", search);
  if (advisor) q.set("advisor_user_id", advisor);
  return apiFetch<OpportunityBoard>(`/vehicle-opportunities?${q}`);
};
export const getOpportunity = (id: string) =>
  apiFetch<Opportunity>(`/vehicle-opportunities/${id}`);
export const createOpportunity = (body: Record<string, unknown>) =>
  apiFetch<Opportunity>("/vehicle-opportunities", {
    method: "POST",
    body: JSON.stringify(body),
    toastOnError: false,
  });
export const updateOpportunity = (id: string, body: Record<string, unknown>) =>
  apiFetch<Opportunity>(`/vehicle-opportunities/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
    toastOnError: false,
  });
export const quoteOpportunity = (id: string, body: Record<string, unknown>) =>
  apiFetch<Opportunity>(`/vehicle-opportunities/${id}/quote`, {
    method: "POST",
    body: JSON.stringify(body),
    toastOnError: false,
  });
export const deliverOpportunity = (id: string, reference: string) =>
  apiFetch<Opportunity>(`/vehicle-opportunities/${id}/deliver`, {
    method: "POST",
    body: JSON.stringify({ confirmed: true, reference }),
    toastOnError: false,
  });

export interface SalesAccount {
  id: string;
  name: string;
  currency: string;
}
export const salesAccounts = (filial: string) =>
  apiFetch<SalesAccount[]>(
    `/vehicle-opportunities/accounts/available?filial_id=${filial}`,
  );
export const workflowAction = (
  id: string,
  path: string,
  body: Record<string, unknown>,
  method = "POST",
) =>
  apiFetch<Opportunity>(`/vehicle-opportunities/${id}/${path}`, {
    method,
    body: JSON.stringify(body),
    toastOnError: false,
  });
export const uploadOpportunityDocument = (
  opp: Opportunity,
  kind: string,
  file: File,
) => {
  const body = new FormData();
  body.append("expected_version", String(opp.version));
  body.append("file", file);
  return apiFetch<Opportunity>(
    `/vehicle-opportunities/${opp.id}/documents/${kind}`,
    { method: "POST", body, toastOnError: false },
  );
};
