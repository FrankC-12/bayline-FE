"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useParts } from "@/hooks/useParts";
import { useWarehouses } from "@/hooks/useWarehouses";
import { getPurchaseRequest, updatePurchaseRequestStatus } from "@/lib/api/administracion";
import type { PurchaseRequest, PurchaseRequestStatus } from "@/types/administracion";

const STATUS_LABELS: Record<PurchaseRequestStatus, string> = {
  enviada: "Enviada, esperando cotización",
  cotizada: "Cotizada",
  pagada: "Pagada",
  recibida: "Recibida",
  conciliada: "Conciliada",
  cancelada: "Cancelada",
};

const NEXT_STATUS: Partial<Record<PurchaseRequestStatus, PurchaseRequestStatus>> = {
  enviada: "cotizada",
  cotizada: "pagada",
  pagada: "recibida",
  recibida: "conciliada",
};

interface PurchaseRequestDetailViewProps {
  requestId: string;
}

export default function PurchaseRequestDetailView({ requestId }: PurchaseRequestDetailViewProps) {
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;

  const { suppliers } = useSuppliers(filialId);
  const { parts } = useParts(filialId);
  const { warehouses } = useWarehouses(filialId);

  const [request, setRequest] = useState<PurchaseRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [quoteCosts, setQuoteCosts] = useState<Record<string, string>>({});
  const [warehouseId, setWarehouseId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const data = await getPurchaseRequest(requestId);
    setRequest(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId]);

  const partName = (id: string) => parts.find((p) => p.id === id)?.name ?? "—";
  const partCode = (id: string) => parts.find((p) => p.id === id)?.code ?? "—";
  const supplierName = (id: string) => suppliers.find((s) => s.id === id)?.business_name ?? "—";

  async function handleAdvance() {
    if (!request) return;
    const next = NEXT_STATUS[request.status];
    if (!next) return;

    setSubmitting(true);
    setError(null);
    try {
      if (next === "cotizada") {
        const quotes = request.lines.map((line) => ({
          line_id: line.id,
          unit_cost: Number(quoteCosts[line.id]) || 0,
        }));
        if (quotes.some((q) => q.unit_cost <= 0)) {
          setError("Ingresa un costo unitario mayor a 0 para cada línea.");
          setSubmitting(false);
          return;
        }
        await updatePurchaseRequestStatus(request.id, next, quotes);
      } else if (next === "recibida") {
        if (!warehouseId) {
          setError("Selecciona el almacén que recibe la mercancía.");
          setSubmitting(false);
          return;
        }
        await updatePurchaseRequestStatus(request.id, next, undefined, warehouseId);
      } else {
        await updatePurchaseRequestStatus(request.id, next);
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo avanzar el estado.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel() {
    if (!request) return;
    setSubmitting(true);
    try {
      await updatePurchaseRequestStatus(request.id, "cancelada");
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !request) {
    return <div className="p-12 text-center text-sm text-steel">Cargando solicitud...</div>;
  }

  const next = NEXT_STATUS[request.status];

  return (
    <div>
      <Link
        href="/dashboard/administracion"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-steel hover:text-navy"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver al historial de compras
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-navy">{request.code}</h1>
          <p className="mt-1 text-sm text-steel">{supplierName(request.supplier_id)}</p>
        </div>
        <span className="rounded-full bg-blue-light px-4 py-2 text-sm font-semibold text-blue">
          {STATUS_LABELS[request.status]}
        </span>
      </div>

      <div className="rounded-2xl border border-navy/10 bg-white p-6">
        <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-steel">Líneas de repuesto</p>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-navy/10 text-steel">
              <th className="pb-2 font-mono text-[10px] uppercase tracking-widest">Repuesto</th>
              <th className="pb-2 font-mono text-[10px] uppercase tracking-widest">Cant.</th>
              <th className="pb-2 font-mono text-[10px] uppercase tracking-widest">Costo unit.</th>
              <th className="pb-2 text-right font-mono text-[10px] uppercase tracking-widest">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {request.lines.map((line) => (
              <tr key={line.id}>
                <td className="py-2">
                  <span className="font-mono text-blue">{partCode(line.part_id)}</span>{" "}
                  <span className="text-navy">{partName(line.part_id)}</span>
                </td>
                <td className="py-2 text-navy">{line.quantity}</td>
                <td className="py-2">
                  {request.status === "enviada" ? (
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={quoteCosts[line.id] ?? ""}
                      onChange={(e) => setQuoteCosts((prev) => ({ ...prev, [line.id]: e.target.value }))}
                      placeholder="0.00"
                      className="w-24 rounded-lg border border-navy/15 px-2 py-1.5 text-sm outline-none focus:border-blue"
                    />
                  ) : line.unit_cost != null ? (
                    `$${line.unit_cost.toFixed(2)}`
                  ) : (
                    "—"
                  )}
                </td>
                <td className="py-2 text-right font-medium text-navy">
                  {line.subtotal != null ? `$${line.subtotal.toFixed(2)}` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {request.total_quoted != null && (
          <div className="mt-4 flex justify-end border-t border-navy/10 pt-4">
            <span className="font-display text-lg font-bold text-navy">
              Total: ${request.total_quoted.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {request.status === "pagada" && next === "recibida" && (
        <div className="mt-4 rounded-2xl border border-navy/10 bg-white p-6">
          <label className="mb-1.5 block text-sm font-medium text-navy">Almacén que recibe</label>
          <select
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
            className="w-full max-w-xs rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
          >
            <option value="">Selecciona un almacén...</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-steel">
            Al recibir, se crea un lote FIFO por cada línea en el almacén elegido, con el costo cotizado.
          </p>
        </div>
      )}

      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      {(next || request.status === "enviada" || request.status === "cotizada" || request.status === "pagada") && (
        <div className="mt-6 flex items-center gap-3">
          {next && (
            <button
              onClick={handleAdvance}
              disabled={submitting}
              className="flex items-center justify-center gap-2 rounded-full bg-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Marcar como {STATUS_LABELS[next]}
            </button>
          )}
          {(request.status === "enviada" || request.status === "cotizada" || request.status === "pagada") && (
            <button
              onClick={handleCancel}
              disabled={submitting}
              className="text-sm font-semibold text-red-500 hover:text-red-600"
            >
              Cancelar solicitud
            </button>
          )}
        </div>
      )}
    </div>
  );
}