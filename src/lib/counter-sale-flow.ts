export function counterSaleLabel(sale: {
  status: string;
  dispatched_at?: string | null;
}) {
  if (sale.status === "completado") return "Recibido en mostrador";
  if (sale.status === "cancelado") return "Cancelado";
  return sale.status === "pedido" && sale.dispatched_at
    ? "Despachado por almacén · confirmar recepción"
    : "Esperando despacho de almacén";
}
export function counterSaleActions(
  sale: { status: string; dispatched_at?: string | null },
  warehouseView: boolean,
  canWarehouseEdit: boolean,
  canSalesEdit: boolean,
) {
  return {
    dispatch:
      warehouseView &&
      canWarehouseEdit &&
      !sale.dispatched_at &&
      ["pendiente", "pedido"].includes(sale.status),
    receive:
      !warehouseView &&
      canSalesEdit &&
      sale.status === "pedido" &&
      !!sale.dispatched_at,
  };
}
