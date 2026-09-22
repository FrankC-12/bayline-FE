"use client";

import { useEffect, useState } from "react";
import { Package, Search, Trash2 } from "lucide-react";
import { useParts } from "@/hooks/useParts";
import { useToast } from "@/contexts/ToastContext";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import type { ServiceOrderTransfer, ServiceOrderPayer, TransferLine } from "@/types/serviceOrder";
import type { Part } from "@/types/parts";

interface TransfersCardProps {
  filialId: string;
  readOnly?: boolean;
  transfers: ServiceOrderTransfer[];
  onAddLine: (partId: string, quantity: number, payer: ServiceOrderPayer) => Promise<void>;
  onChangeQuantity: (lineId: string, quantity: number) => Promise<void>;
  onRemoveLine: (lineId: string) => Promise<void>;
  onMarkOrdered: (transferId: string) => Promise<void>;
}

function TransferLineRow({
  line,
  part,
  canEdit,
  onChangeQuantity,
  onRemoveLine,
}: {
  line: TransferLine;
  part: Part | undefined;
  canEdit: boolean;
  onChangeQuantity: (lineId: string, quantity: number) => Promise<void>;
  onRemoveLine: (lineId: string) => Promise<void>;
}) {
  const [quantity, setQuantity] = useState(String(line.quantity));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setQuantity(String(line.quantity));
  }, [line.quantity]);

  async function commit() {
    const next = Math.trunc(Number(quantity));
    if (!Number.isFinite(next) || next < 1 || next === line.quantity) {
      setQuantity(String(line.quantity));
      return;
    }
    setBusy(true);
    try {
      await onChangeQuantity(line.id, next);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await onRemoveLine(line.id);
    } finally {
      setBusy(false);
    }
  }

  return (
    <tr>
      <td className="py-1.5 text-navy">
        {part?.name ?? "—"}
        <span className="mt-1 block font-mono text-xs text-blue">{part?.code}</span>
      </td>
      <td className="py-1.5 text-navy">
        {canEdit ? (
          <input
            type="number"
            min={1}
            value={quantity}
            disabled={busy}
            onChange={(e) => setQuantity(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
            className="w-16 rounded-lg border border-navy/15 px-2 py-1 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20 disabled:opacity-60"
          />
        ) : (
          line.quantity
        )}
      </td>
      <td className="py-1.5 text-right text-navy">
        {line.unit_price == null ? "—" : `$${line.unit_price.toFixed(2)}`}
      </td>
      <td className="py-1.5 text-right font-medium text-navy">
        {line.subtotal == null ? "—" : `$${line.subtotal.toFixed(2)}`}
      </td>
      {canEdit && (
        <td className="py-1.5 pl-2 text-right">
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            aria-label={`Quitar ${part?.name ?? "repuesto"}`}
            className="rounded-lg p-1.5 text-red-500 transition hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </td>
      )}
    </tr>
  );
}

export default function TransfersCard({
  filialId,
  transfers,
  onAddLine,
  onChangeQuantity,
  onRemoveLine,
  onMarkOrdered,
  readOnly = false,
}: TransfersCardProps) {
  const { parts } = useParts(filialId);
  const partById = (id: string): Part | undefined => parts.find((p) => p.id === id);

  const [search, setSearch] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [adding, setAdding] = useState(false);
  const [confirmingTransferId, setConfirmingTransferId] = useState<string | null>(null);
  const [dispatching, setDispatching] = useState(false);
  const toast = useToast();

  async function handleConfirmMarkOrdered() {
    if (!confirmingTransferId) return;
    setDispatching(true);
    try {
      await onMarkOrdered(confirmingTransferId);
      setConfirmingTransferId(null);
      toast.success("Repuestos enviados a almacén — la ODT quedó marcada como Pedido.");
    } finally {
      setDispatching(false);
    }
  }

  const results = search
    ? parts
        .filter(
          (p) =>
            p.code.toLowerCase().includes(search.toLowerCase()) ||
            p.name.toLowerCase().includes(search.toLowerCase())
        )
        .slice(0, 6)
    : [];

  async function handleAdd(partId: string) {
    if (readOnly) return;
    setAdding(true);
    try {
      await onAddLine(partId, Number(quantity) || 1, "cliente");
      setSearch("");
      setQuantity("1");
    } finally {
      setAdding(false);
    }
  }

  const pendingCount = transfers.filter((t) => t.status === "pendiente").length;

  return (
    <div className="rounded-2xl border border-navy/10 bg-white p-6">
      <h3 className="mb-1 font-display text-lg font-bold text-navy">Órdenes de Transferencia</h3>
      <p className="mb-4 text-sm text-steel">
        Repuestos pedidos al almacén para esta orden. El stock se descuenta al marcar como Pedido.
      </p>

      <div className="mb-5 flex items-end gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={adding || readOnly}
            placeholder="Agregar repuesto — código o nombre..."
            className="w-full rounded-xl border border-navy/15 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20 disabled:opacity-60"
          />
          {!readOnly && results.length > 0 && (
            <div className="absolute z-10 mt-1 w-full divide-y divide-navy/5 rounded-xl border border-navy/10 bg-white shadow-lg">
              {results.map((p) => (
                <button
                  key={p.id}
                  type="button"
                    disabled={readOnly || adding}
                  onClick={() => handleAdd(p.id)}
                  className="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-ash"
                >
                  <span>
                    <span className="font-mono text-blue">{p.code}</span>{" "}
                    <span className="text-navy">{p.name}</span>
                  </span>
                  <span className="text-xs text-steel">
                    ${p.reference_price?.toFixed(2) ?? "Sin costo"} · stock {p.stock_total}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        <input
          type="number"
          disabled={readOnly || adding}
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="w-16 rounded-xl border border-navy/15 px-2 py-2.5 text-center text-sm outline-none focus:border-blue"
        />

      </div>

      {transfers.length === 0 ? (
        <p className="rounded-xl bg-ash px-4 py-6 text-center text-sm text-steel">
          Todavía no hay repuestos pedidos para esta orden.
        </p>
      ) : (
        <div className="space-y-4">
          {transfers.map((transfer) => {
            const canEditLines = !readOnly && transfer.status === "pendiente";
            return (
              <div key={transfer.id} className="rounded-xl border border-navy/10 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue" />
                    <span className="font-mono text-sm font-semibold text-navy">{transfer.code}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-widest ${
                        transfer.status === "completado"
                          ? "bg-blue-light text-blue"
                          : transfer.status === "pedido"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {transfer.status === "completado" ? "Completado" : transfer.status === "pedido" ? "Pedido" : "Pendiente"}
                    </span>
                  </div>
                  {transfer.status === "pendiente" && transfer.lines.length > 0 && (
                    <button
                      type="button"
                      disabled={readOnly || adding}
                      onClick={() => setConfirmingTransferId(transfer.id)}
                      className="rounded-full bg-blue px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-navy"
                    >
                      Marcar como Pedido
                    </button>
                  )}
                </div>

                {transfer.lines.length === 0 ? (
                  <p className="rounded-lg bg-ash px-3 py-2 text-xs text-steel">
                    Sin repuestos — se quitaron todos de esta ODT.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[520px] text-left text-sm">
                      <thead>
                        <tr className="text-steel">
                          <th className="pb-1.5 font-mono text-[10px] uppercase tracking-widest">Repuesto</th>
                          <th className="pb-1.5 font-mono text-[10px] uppercase tracking-widest">Cant.</th>
                          <th className="pb-1.5 text-right font-mono text-[10px] uppercase tracking-widest">
                            PVP
                          </th>
                          <th className="pb-1.5 text-right font-mono text-[10px] uppercase tracking-widest">
                            Subtotal
                          </th>
                          {canEditLines && <th className="pb-1.5" />}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-navy/5">
                        {transfer.lines.map((line) => (
                          <TransferLineRow
                            key={line.id}
                            line={line}
                            part={partById(line.part_id)}
                            canEdit={canEditLines}
                            onChangeQuantity={onChangeQuantity}
                            onRemoveLine={onRemoveLine}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="mt-2 flex justify-end text-sm font-semibold text-navy">
                  Subtotal: {transfer.subtotal == null ? "—" : `$${transfer.subtotal.toFixed(2)}`}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!readOnly && pendingCount === 0 && transfers.length > 0 && (
        <p className="mt-3 text-xs text-steel">
          Todas las ODT de esta orden ya fueron pedidas. Al agregar otro repuesto se abre una nueva.
        </p>
      )}

      <ConfirmDialog
        open={confirmingTransferId !== null}
        title="¿Confirmar envío al almacén?"
        description={`Una vez marcada como "Pedido", esta Orden de Transferencia ya no podrá modificarse ni eliminarse. Verifica que los repuestos y cantidades sean correctos antes de continuar.`}
        confirmLabel="Sí, marcar como Pedido"
        confirming={dispatching}
        onConfirm={handleConfirmMarkOrdered}
        onCancel={() => setConfirmingTransferId(null)}
      />
    </div>
  );
}
