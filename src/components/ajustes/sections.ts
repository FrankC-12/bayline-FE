export const SETTINGS_GROUPS = [
  { label: "Finanzas", items: [{ id: "impuestos", label: "Impuestos y tasa" }, { id: "retenciones", label: "Retenciones" }, { id: "movimientos-manuales", label: "Movimientos manuales" }] },
  { label: "Taller", items: [{ id: "mano-de-obra", label: "Mano de obra" }, { id: "temparios", label: "Temparios" }, { id: "garantias", label: "Garantías" }, { id: "bahias", label: "Bahías" }] },
  { label: "Catálogos", items: [{ id: "marcas-modelos", label: "Marcas y modelos" }, { id: "categorias-repuestos", label: "Categorías de repuestos" }, { id: "medidas-repuestos", label: "Medidas de repuestos" }, { id: "entradas-repuestos", label: "Entradas de repuestos" }, { id: "salidas-repuestos", label: "Salidas de repuestos" }] },
];
export const SETTINGS_ITEMS = SETTINGS_GROUPS.flatMap(group => group.items);
