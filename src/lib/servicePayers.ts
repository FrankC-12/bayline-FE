import type { ServiceOrderPayer } from "@/types/serviceOrder";

export const PAYER_LABELS: Record<ServiceOrderPayer, string> = {
  cliente: "Cliente",
  garantia_taller: "Garantía taller",
  garantia_fabrica: "Garantía fábrica",
  plan_mantenimiento: "Plan de mantenimiento",
  proveedor: "Proveedor",
};

// "proveedor" stays in PAYER_LABELS (existing lines/tasks assigned to it via
// a warranty-claim conversion still need a label to display) but is no
// longer a manually selectable option here — a human can't assign it by
// hand anymore, only the automatic conversion flow sets it.
export const PAYER_OPTIONS: ServiceOrderPayer[] = [
  "cliente",
  "garantia_taller",
  "garantia_fabrica",
  "plan_mantenimiento",
];
