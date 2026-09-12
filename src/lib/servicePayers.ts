import type { ServiceOrderPayer } from "@/types/serviceOrder";

export const PAYER_LABELS: Record<ServiceOrderPayer, string> = {
  cliente: "Cliente",
  garantia_taller: "Garantía taller",
  garantia_fabrica: "Garantía fábrica",
  plan_mantenimiento: "Plan de mantenimiento",
  proveedor: "Proveedor",
};

export const PAYER_OPTIONS: ServiceOrderPayer[] = [
  "cliente",
  "garantia_taller",
  "garantia_fabrica",
  "plan_mantenimiento",
  "proveedor",
];
