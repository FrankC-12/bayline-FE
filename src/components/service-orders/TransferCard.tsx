"use client";

import { useState } from "react";
import { Package, Search } from "lucide-react";
import { useParts } from "@/hooks/useParts";
import type { ServiceOrderTransfer } from "@/types/serviceOrder";
import type { Part } from "@/types/parts";

interface TransfersCardProps {
  filialId: string;
  transfers: ServiceOrderTransfer[];
  onAddLine: (partId: string, quantity: number) => Promise<void>;
  onMarkOrdered: (transferId: string) => Promise<void>;
}

export default function TransfersCard({
  filialId,
  transfers,
  onAddLine,
  onMarkOrdered,
}: TransfersCardProps) {
  const { parts } = useParts(filialId);
  const partById = (id: string): Part | undefined => parts.find((p) => p.id === id);

  const [search, setSearch] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [adding, setAdding] = useState(false);

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
    setAdding(true);
    try {
      await onAddLine(partId, Number(quantity) || 1);
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
            disabled={adding}
            placeholder="Agregar repuesto — código o nombre..."
            className="w-full rounded-xl border border-navy/15 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20 disabled:opacity-60"
          />
          {results.length > 0 && (
            <div className="absolute z-10 mt-1 w-full divide-y divide-navy/5 rounded-xl border border-navy/10 bg-white shadow-lg">
              {results.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleAdd(p.id)}
                  className="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-ash"
                >
                  <span>
                    <span className="font-mono text-blue">{p.code}</span>{" "}
                    <span className="text-navy">{p.name}</span>
                  </span>
                  <span className="text-xs text-steel">
                    ${p.price.toFixed(2)} · stock {p.stock_quantity}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        <input
          type="number"
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
          {transfers.map((transfer) => (
            <div key={transfer.id} className="rounded-xl border border-navy/10 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue" />
                  <span className="font-mono text-sm font-semibold text-navy">{transfer.code}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-widest ${
                      transfer.status === "pedido"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {transfer.status === "pedido" ? "Pedido" : "Pendiente"}
                  </span>
                </div>
                {transfer.status === "pendiente" && (
                  <button
                    type="button"
                    onClick={() => onMarkOrdered(transfer.id)}
                    className="rounded-full bg-blue px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-navy"
                  >
                    Marcar como Pedido
                  </button>
                )}
              </div>

              <table className="w-full text-left text-sm">
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy/5">
                  {transfer.lines.map((line) => {
                    const part = partById(line.part_id);
                    return (
                      <tr key={line.id}>
                        <td className="py-1.5 text-navy">{part?.name ?? "—"}</td>
                        <td className="py-1.5 text-navy">{line.quantity}</td>
                        <td className="py-1.5 text-right text-navy">${line.unit_price.toFixed(2)}</td>
                        <td className="py-1.5 text-right font-medium text-navy">
                          ${line.subtotal.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="mt-2 flex justify-end text-sm font-semibold text-navy">
                Subtotal: ${transfer.subtotal.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      )}

      {pendingCount === 0 && transfers.length > 0 && (
        <p className="mt-3 text-xs text-steel">
          Todas las ODT de esta orden ya fueron pedidas. Al agregar otro repuesto se abre una nueva.
        </p>
      )}
    </div>
  );
}