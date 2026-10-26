import {
  formatMoney,
  formatCount,
  formatEntryDate,
  formatEntryDateTime,
} from "./format";
export function localToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Caracas",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
export function renderCell(v: unknown, format: string, currency = "usd") {
  if (v === null || v === undefined || v === "") return "—";
  if (format === "money")
    return `${currency === "bs" ? "Bs." : currency === "eur" ? "€" : "$"} ${formatMoney(Number(v))}`;
  if (format === "number" || format === "percent")
    return `${formatCount(Number(v))}${format === "percent" ? " %" : ""}`;
  if (format === "date") return formatEntryDate(String(v));
  if (format === "datetime") return formatEntryDateTime(String(v));
  const labels: Record<string, string> = {
    requested: "Solicitada",
    approved: "Aprobada",
    dispatched: "Despachada",
    received: "Recibida",
    rejected: "Rechazada",
    contacto: "Contacto",
    cotizacion: "Cotización",
    negociacion: "Negociación",
    ganada: "Ganada",
    perdida: "Perdida",
    recepcion: "Recepción",
    taller: "En taller",
    repuestos: "Repuestos",
    control_calidad: "Control de calidad",
    entrega: "Entrega",
    asset: "Activo",
    liability: "Pasivo",
    equity: "Patrimonio",
    revenue: "Ingreso",
    cost: "Costo",
    expense: "Gasto",
    create: "Creación",
    update: "Actualización",
    delete: "Eliminación",
    login: "Inicio de sesión",
    en_transito: "En tránsito",
    disponible: "Disponible",
    reservado: "Reservado",
    en_preparacion: "En preparación",
    vendido: "Vendido",
    entregado: "Entregado",
    nuevo: "Nuevo",
    usado: "Usado",
    activa: "Activa",
    inactiva: "Inactiva",
  };
  return labels[String(v)] ?? String(v).replaceAll("_", " ");
}
