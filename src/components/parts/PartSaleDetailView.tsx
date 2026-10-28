"use client";

import PartPaymentModal from "./PartPaymentModal";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import { NumberInput } from "@/components/ui/NumberInput";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ChevronLeft, Loader2 } from "lucide-react";
import { counterSaleLabel, counterSaleActions } from "@/lib/counter-sale-flow";
import { downloadBlob } from "@/lib/download";
import {
  getPartSale,
  updatePartSaleStatus,
  getPartSalePdf,
} from "@/lib/api/parts";
import { formatMoney, formatCount } from "@/lib/format";
import type { PartSale } from "@/types/parts";

const STATUS_STYLES: Record<string, string> = {
  pendiente: "bg-amber-100 text-amber-700",
  pedido: "bg-blue-light text-blue",
  completado: "bg-emerald-100 text-emerald-700",
  cancelado: "bg-red-100 text-red-700",
};

interface PartSaleDetailViewProps {
  saleId: string;
  warehouseView?: boolean;
}

export default function PartSaleDetailView({
  saleId,
  warehouseView = false,
}: PartSaleDetailViewProps) {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { canEdit: canCollect } = useModuleAccess("finanzas-cobrar");
  const [collecting, setCollecting] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const { canEdit: canWarehouseEdit } = useModuleAccess("almacen");
  const { canEdit: hasSalesEdit } = useModuleAccess("repuestos");
  const canSalesEdit = hasSalesEdit && currentUser?.roleSlug !== "almacenista";
  const backHref = warehouseView
    ? "/dashboard/almacen/transferencias?tab=mostrador"
    : "/dashboard/repuestos/ventas";

  const [sale, setSale] = useState<PartSale | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dispatchDrafts, setDispatchDrafts] = useState<Record<string, string>>(
    {},
  );
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const data = await getPartSale(saleId);
      setSale(data);
      setDispatchDrafts(
        Object.fromEntries(
          data.lines.map((l) => [
            l.id,
            String(l.dispatched_quantity ?? l.quantity),
          ]),
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo cargar la venta.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    setSale(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saleId]);

  useEffect(() => {
    if (!sale?.status || ["completado", "cancelado"].includes(sale.status))
      return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible")
        void getPartSale(saleId)
          .then(setSale)
          .catch(() => {});
    }, 15000);
    return () => window.clearInterval(timer);
  }, [saleId, sale?.status]);

  const partName = (id: string) =>
    sale?.lines.find((line) => line.part_id === id)?.part_name ?? "—";
  const partCode = (id: string) =>
    sale?.lines.find((line) => line.part_id === id)?.part_code ?? "—";

  async function markAsPedido() {
    if (!sale) return;
    setSubmitting(true);
    setActionError(null);
    try {
      const updated = await updatePartSaleStatus(
        sale.id,
        "pedido",
        sale.lines.map((line) => ({
          line_id: line.id,
          dispatched_quantity:
            Number(dispatchDrafts[line.id] ?? line.quantity) || 0,
        })),
      );
      setSale(updated);
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "No se pudo marcar la venta como despachando.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function advance(status: "completado" | "cancelado") {
    if (!sale) return;
    setSubmitting(true);
    setActionError(null);
    try {
      const updated = await updatePartSaleStatus(sale.id, status);
      setSale(updated);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "No se pudo actualizar la venta.",
      );
      throw err;
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-12 text-center text-sm text-steel">
        Cargando venta...
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div className="text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
        <h1 className="mt-4 font-display text-xl font-bold text-navy">
          No se pudo cargar la venta
        </h1>
        <p className="mt-2 text-sm text-steel">
          {error ?? "La venta no existe o fue eliminada."}
        </p>
        <button
          onClick={() => router.push(backHref)}
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-steel hover:text-navy"
        >
          <ChevronLeft className="h-4 w-4" />
          {warehouseView ? "Volver a Almacén" : "Volver a Ventas de Repuestos"}
        </button>
      </div>
    );
  }

  const { dispatch: canDispatch, receive: canReceive } = counterSaleActions(
    sale,
    warehouseView,
    canWarehouseEdit,
    canSalesEdit &&
      (currentUser?.roleSlug === "filial-admin" ||
        sale.dispatched_by_user_id !== currentUser?.userId),
  );
  const canCancel =
    !warehouseView &&
    canSalesEdit &&
    sale.amount_collected <= 0 &&
    (sale.status === "pendiente" || sale.status === "pedido");

  return (
    <div>
      <button
        onClick={() => router.push(backHref)}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-steel hover:text-navy"
      >
        <ChevronLeft className="h-4 w-4" />
        {warehouseView ? "Volver a Almacén" : "Volver a Ventas de Repuestos"}
      </button>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-navy">
            {sale.code}
          </h1>
          <p className="mt-1 text-sm text-steel">
            {sale.client_name}
            {sale.warehouse_name && ` · Almacén: ${sale.warehouse_name}`}
          </p>
        </div>
        <span
          className={`rounded-full px-4 py-2 text-sm font-semibold ${STATUS_STYLES[sale.status]}`}
        >
          {counterSaleLabel(sale)}
        </span>
      </div>

      {sale.status !== "cancelado" && (
        <section className="mb-5 rounded-2xl border border-navy/10 bg-white p-5">
          <ol aria-label="Flujo de venta" className="grid gap-3 sm:grid-cols-3">
            {[
              { id: "pendiente", label: "Esperando despacho de almacén" },
              { id: "pedido", label: "Despachado por almacén" },
              { id: "completado", label: "Recibido en mostrador" },
            ].map((step, index) => {
              const current = ["pendiente", "pedido", "completado"].indexOf(
                sale.status,
              );
              return (
                <li
                  key={step.id}
                  aria-current={sale.status === step.id ? "step" : undefined}
                  className={`rounded-xl border p-3 text-sm ${index === current ? "border-blue bg-blue-light font-semibold text-blue" : index < current ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-navy/10 text-steel"}`}
                >
                  <span className="mb-1 block font-mono text-xs">
                    {index + 1}
                  </span>
                  {step.label}
                </li>
              );
            })}
          </ol>
          <p className="mt-4 text-sm text-steel">
            <strong className="text-navy">Siguiente paso: </strong>
            {sale.status === "pendiente"
              ? warehouseView
                ? "verifica las cantidades y confirma el despacho hacia mostrador."
                : "esperando despacho de almacén. Te avisaremos cuando puedas confirmar la recepción."
              : sale.status === "pedido"
                ? !sale.dispatched_at
                  ? "almacén debe confirmar el despacho de esta solicitud."
                  : warehouseView
                    ? "despacho registrado. Esperando confirmación de recepción en mostrador."
                    : "confirma la recepción de los repuestos en el mostrador."
                : sale.pending_amount > 0
                  ? "registra el cobro o consulta el saldo pendiente."
                  : "venta confirmada y cobrada; puedes consultar su factura."}
          </p>
        </section>
      )}
      <div className="rounded-2xl border border-navy/10 bg-white p-6">
        <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-steel">
          Líneas de repuesto
        </p>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-navy/10 text-steel">
              <th className="pb-2 font-mono text-[10px] uppercase tracking-widest">
                Repuesto
              </th>
              <th className="pb-2 font-mono text-[10px] uppercase tracking-widest">
                Cant. vendida
              </th>
              <th className="pb-2 font-mono text-[10px] uppercase tracking-widest">
                Cant. despachada
              </th>
              <th className="pb-2 text-right font-mono text-[10px] uppercase tracking-widest">
                Subtotal
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {sale.lines.map((line) => {
              const draftMismatch =
                canDispatch &&
                dispatchDrafts[line.id] !== undefined &&
                Number(dispatchDrafts[line.id]) !== line.quantity;
              const confirmedMismatch =
                line.dispatched_quantity != null &&
                line.dispatched_quantity !== line.quantity;
              return (
                <tr key={line.id}>
                  <td className="py-2">
                    <span className="font-mono text-blue">
                      {partCode(line.part_id)}
                    </span>{" "}
                    <span className="text-navy">{partName(line.part_id)}</span>
                  </td>
                  <td className="py-2 text-navy">
                    {formatCount(line.quantity)}
                  </td>
                  <td className="py-2">
                    {canDispatch ? (
                      <NumberInput
                        min="0"
                        value={dispatchDrafts[line.id] ?? ""}
                        onValueChange={(value) =>
                          setDispatchDrafts((prev) => ({
                            ...prev,
                            [line.id]: value,
                          }))
                        }
                        className={`w-24 rounded-lg border px-2 py-1.5 text-sm outline-none focus:border-blue ${
                          draftMismatch ? "border-amber-400" : "border-navy/15"
                        }`}
                      />
                    ) : line.dispatched_quantity != null ? (
                      <span
                        className={
                          confirmedMismatch
                            ? "font-semibold text-red-600"
                            : "text-navy"
                        }
                      >
                        {formatCount(line.dispatched_quantity)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-2 text-right font-medium text-navy">
                    ${formatMoney(line.line_total)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="mt-4 space-y-1 border-t border-navy/10 pt-4 text-right text-sm">
          <p className="text-steel">Subtotal: ${formatMoney(sale.total)}</p>
          <p className="text-steel">
            IVA ({formatCount(sale.iva_percentage)}%): $
            {formatMoney(sale.iva_amount)}
          </p>
          <p className="text-steel">
            IGTF ({formatCount(sale.igtf_percentage)}%): $
            {formatMoney(sale.igtf_amount)}
          </p>
          <p className="text-steel">
            Cobrado: ${formatMoney(sale.amount_collected)} · Pendiente: $
            {formatMoney(sale.pending_amount)}
          </p>
          <p className="font-semibold text-navy">
            {sale.status === "cancelado"
              ? "Cancelado"
              : sale.pending_amount <= 0
                ? "Pagado"
                : sale.amount_collected > 0
                  ? "Abono registrado"
                  : "Pendiente de pago"}
          </p>
          <p className="font-display text-lg font-bold text-navy">
            Total: ${formatMoney(sale.total_with_taxes)}
          </p>
        </div>
      </div>

      {canDispatch && (
        <p className="mt-4 text-xs text-steel">
          Confirma cuánto se despachó realmente de cada línea. Si no coincide
          con lo vendido, no se podrá confirmar el despacho hasta resolver la
          diferencia.
        </p>
      )}

      {sale.status === "completado" &&
        sale.lines.some((l) => l.warranties.length > 0) && (
          <div className="mt-6 rounded-2xl border border-navy/10 bg-white p-6">
            <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-steel">
              Garantía de pieza (no cubre instalación)
            </p>
            <div className="space-y-3">
              {sale.lines
                .filter((line) => line.warranties.length > 0)
                .map((line) => {
                  const expiresAt = line.warranties[0].expires_at;
                  const active = line.warranties.every((w) => w.is_active);
                  return (
                    <div
                      key={line.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-ash px-4 py-3 text-sm"
                    >
                      <div>
                        <span className="font-medium text-navy">
                          {partName(line.part_id)}
                        </span>{" "}
                        <span className="text-steel">
                          · lote(s){" "}
                          {line.warranties.map((w) => w.lot_code).join(", ")}
                        </span>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          active
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {active ? "Vigente" : "Vencida"} hasta{" "}
                        {new Date(expiresAt).toLocaleDateString("es-VE")}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

      {actionError && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {actionError}
        </p>
      )}

      {collecting && (
        <PartPaymentModal
          saleId={sale.id}
          code={sale.code}
          onClose={() => {
            setCollecting(false);
            setConfirming(false);
          }}
          onCollected={async () => {
            await load();
          }}
        />
      )}
      {confirming && !collecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Confirmar recepción en mostrador"
            className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6"
          >
            <h2 className="font-display text-xl font-bold text-navy">
              ¿Recibiste los repuestos en mostrador?
            </h2>
            <p className="text-sm text-steel">
              Confirma únicamente cuando hayas recibido y revisado las
              cantidades despachadas por almacén. El cobro se registra por
              separado.
            </p>
            <button
              disabled={submitting}
              onClick={() => {
                void advance("completado")
                  .then(() => setConfirming(false))
                  .catch(() => {});
              }}
              className="w-full p-3 font-semibold text-blue"
            >
              Confirmar recepción
            </button>
            {!canCollect && sale.pending_amount > 0 && (
              <p className="text-xs text-steel">
                Un usuario con permiso de cobro debe registrar el pago. La venta
                queda en Cuentas por Cobrar.
              </p>
            )}
            <button
              disabled={submitting}
              onClick={() => setConfirming(false)}
              className="w-full p-2 text-steel"
            >
              Volver
            </button>
            {actionError && (
              <p role="alert" className="text-sm text-red-600">
                {actionError}
              </p>
            )}
          </div>
        </div>
      )}
      <div className="mt-6 flex items-center gap-3">
        {!warehouseView && sale.status === "completado" && (
          <button
            disabled={submitting}
            onClick={() => {
              setSubmitting(true);
              setActionError(null);
              void getPartSalePdf(sale.id)
                .then((blob) => downloadBlob(blob, `${sale.code}.pdf`))
                .catch((err: unknown) =>
                  setActionError(
                    err instanceof Error
                      ? err.message
                      : "No se pudo descargar la factura.",
                  ),
                )
                .finally(() => setSubmitting(false));
            }}
            className="rounded-full border border-blue px-6 py-2.5 text-sm font-semibold text-blue"
          >
            Descargar factura PDF
          </button>
        )}
        {!warehouseView &&
          canCollect &&
          sale.status !== "cancelado" &&
          sale.pending_amount > 0 && (
            <button
              onClick={() => {
                setConfirming(false);
                setCollecting(true);
              }}
              className="rounded-full bg-blue px-6 py-2.5 text-sm font-semibold text-white"
            >
              Registrar cobro
            </button>
          )}
        {canDispatch && (
          <button
            onClick={markAsPedido}
            disabled={submitting}
            className="flex items-center justify-center gap-2 rounded-full bg-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Confirmar despacho a mostrador
          </button>
        )}
        {canReceive && (
          <button
            onClick={() => setConfirming(true)}
            disabled={submitting}
            className="flex items-center justify-center gap-2 rounded-full bg-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Confirmar recepción en mostrador
          </button>
        )}
        {canCancel && (
          <button
            onClick={() => void advance("cancelado").catch(() => {})}
            disabled={submitting}
            className="text-sm font-semibold text-red-500 hover:text-red-600"
          >
            Cancelar venta
          </button>
        )}
      </div>
    </div>
  );
}
