"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ChevronLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useParts } from "@/hooks/useParts";
import { getPartSale, updatePartSaleStatus } from "@/lib/api/parts";
import type { PartSale } from "@/types/parts";

const STATUS_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  pedido: "Pedido",
  completado: "Completado",
  cancelado: "Cancelado",
};

const STATUS_STYLES: Record<string, string> = {
  pendiente: "bg-amber-100 text-amber-700",
  pedido: "bg-blue-light text-blue",
  completado: "bg-emerald-100 text-emerald-700",
  cancelado: "bg-red-100 text-red-700",
};

interface PartSaleDetailViewProps {
  saleId: string;
}

export default function PartSaleDetailView({ saleId }: PartSaleDetailViewProps) {
  const router = useRouter();
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;
  const { parts } = useParts(filialId);

  const [sale, setSale] = useState<PartSale | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dispatchDrafts, setDispatchDrafts] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getPartSale(saleId);
      setSale(data);
      setDispatchDrafts(
        Object.fromEntries(
          data.lines.map((l) => [l.id, String(l.dispatched_quantity ?? l.quantity)])
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar la venta.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saleId]);

  const partName = (id: string) => parts.find((p) => p.id === id)?.name ?? "—";
  const partCode = (id: string) => parts.find((p) => p.id === id)?.code ?? "—";

  async function markAsPedido() {
    if (!sale) return;
    setSubmitting(true);
    setActionError(null);
    try {
      await updatePartSaleStatus(
        sale.id,
        "pedido",
        sale.lines.map((line) => ({
          line_id: line.id,
          dispatched_quantity: Number(dispatchDrafts[line.id] ?? line.quantity) || 0,
        }))
      );
      await load();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "No se pudo marcar la venta como despachando."
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
      await updatePartSaleStatus(sale.id, status);
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "No se pudo actualizar la venta.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="p-12 text-center text-sm text-steel">Cargando venta...</div>;
  }

  if (error || !sale) {
    return (
      <div className="text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
        <h1 className="mt-4 font-display text-xl font-bold text-navy">No se pudo cargar la venta</h1>
        <p className="mt-2 text-sm text-steel">{error ?? "La venta no existe o fue eliminada."}</p>
        <button
          onClick={() => router.push("/dashboard/repuestos/ventas")}
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-steel hover:text-navy"
        >
          <ChevronLeft className="h-4 w-4" />
          Volver a Ventas de Repuestos
        </button>
      </div>
    );
  }

  const canCancel = sale.status === "pendiente" || sale.status === "pedido";

  return (
    <div>
      <button
        onClick={() => router.push("/dashboard/repuestos/ventas")}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-steel hover:text-navy"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver a Ventas de Repuestos
      </button>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-navy">{sale.code}</h1>
          <p className="mt-1 text-sm text-steel">{sale.client_name}</p>
        </div>
        <span
          className={`rounded-full px-4 py-2 text-sm font-semibold ${STATUS_STYLES[sale.status]}`}
        >
          {STATUS_LABELS[sale.status]}
        </span>
      </div>

      <div className="rounded-2xl border border-navy/10 bg-white p-6">
        <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-steel">
          Líneas de repuesto
        </p>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-navy/10 text-steel">
              <th className="pb-2 font-mono text-[10px] uppercase tracking-widest">Repuesto</th>
              <th className="pb-2 font-mono text-[10px] uppercase tracking-widest">Cant. vendida</th>
              <th className="pb-2 font-mono text-[10px] uppercase tracking-widest">Cant. despachada</th>
              <th className="pb-2 text-right font-mono text-[10px] uppercase tracking-widest">
                Subtotal
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {sale.lines.map((line) => {
              const draftMismatch =
                sale.status === "pendiente" &&
                dispatchDrafts[line.id] !== undefined &&
                Number(dispatchDrafts[line.id]) !== line.quantity;
              const confirmedMismatch =
                line.dispatched_quantity != null && line.dispatched_quantity !== line.quantity;
              return (
                <tr key={line.id}>
                  <td className="py-2">
                    <span className="font-mono text-blue">{partCode(line.part_id)}</span>{" "}
                    <span className="text-navy">{partName(line.part_id)}</span>
                  </td>
                  <td className="py-2 text-navy">{line.quantity}</td>
                  <td className="py-2">
                    {sale.status === "pendiente" ? (
                      <input
                        type="number"
                        min="0"
                        value={dispatchDrafts[line.id] ?? ""}
                        onChange={(e) =>
                          setDispatchDrafts((prev) => ({ ...prev, [line.id]: e.target.value }))
                        }
                        className={`w-24 rounded-lg border px-2 py-1.5 text-sm outline-none focus:border-blue ${
                          draftMismatch ? "border-amber-400" : "border-navy/15"
                        }`}
                      />
                    ) : line.dispatched_quantity != null ? (
                      <span className={confirmedMismatch ? "font-semibold text-red-600" : "text-navy"}>
                        {line.dispatched_quantity}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-2 text-right font-medium text-navy">
                    ${line.line_total.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="mt-4 flex justify-end border-t border-navy/10 pt-4">
          <span className="font-display text-lg font-bold text-navy">
            Total: ${sale.total.toFixed(2)}
          </span>
        </div>
      </div>

      {sale.status === "pendiente" && (
        <p className="mt-4 text-xs text-steel">
          Confirma cuánto se despachó realmente de cada línea. Si no coincide con lo vendido, la
          venta no podrá marcarse como &quot;Pedido&quot; hasta resolver la diferencia.
        </p>
      )}

      {sale.status === "completado" && sale.lines.some((l) => l.warranties.length > 0) && (
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
                      <span className="font-medium text-navy">{partName(line.part_id)}</span>{" "}
                      <span className="text-steel">
                        · lote(s){" "}
                        {line.warranties.map((w) => w.lot_code).join(", ")}
                      </span>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
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
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{actionError}</p>
      )}

      <div className="mt-6 flex items-center gap-3">
        {sale.status === "pendiente" && (
          <button
            onClick={markAsPedido}
            disabled={submitting}
            className="flex items-center justify-center gap-2 rounded-full bg-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Marcar como despachando
          </button>
        )}
        {sale.status === "pedido" && (
          <button
            onClick={() => advance("completado")}
            disabled={submitting}
            className="flex items-center justify-center gap-2 rounded-full bg-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Confirmar en Mostrador
          </button>
        )}
        {canCancel && (
          <button
            onClick={() => advance("cancelado")}
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
