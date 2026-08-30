"use client";

import { useEffect, useState } from "react";
import { Plus, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWarehouses } from "@/hooks/useWarehouses";
import { useTransfers } from "@/hooks/useTransfers";
import CreateTransferModal from "./CreateTransferModal";
import { formatElapsed } from "@/lib/time";
import type { Transfer, TransferStatus } from "@/types/warehouse";

const STATUS_LABELS: Record<TransferStatus, string> = {
  pedido: "Pedido",
  en_proceso: "En Proceso",
  completada: "Completada",
  cancelada: "Cancelada",
};

const STATUS_STYLES: Record<TransferStatus, string> = {
  pedido: "bg-blue-light text-blue",
  en_proceso: "bg-amber-100 text-amber-700",
  completada: "bg-emerald-100 text-emerald-700",
  cancelada: "bg-red-100 text-red-700",
};

const NEXT_STATUS: Partial<Record<TransferStatus, TransferStatus>> = {
  pedido: "en_proceso",
  en_proceso: "completada",
};

function ElapsedLabel({ transfer }: { transfer: Transfer }) {
  const [, forceTick] = useState(0);
  useEffect(() => {
    if (transfer.status === "completada" || transfer.status === "cancelada") return;
    const id = setInterval(() => forceTick((n) => n + 1), 30000);
    return () => clearInterval(id);
  }, [transfer.status]);

  if (transfer.status === "cancelada") return <span>—</span>;
  return <span>{formatElapsed(transfer.created_at, transfer.completed_at)}</span>;
}

export default function TransfersListView() {
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;

  const { warehouses, addWarehouse } = useWarehouses(filialId);
  const { transfers, loading, addTransfer, setStatus } = useTransfers(filialId);
  const [createOpen, setCreateOpen] = useState(false);
  const warehouseName = (id: string) => warehouses.find((w) => w.id === id)?.name ?? "—";

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-navy">Órdenes de Transferencia</h1>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy"
        >
          <Plus className="h-4 w-4" />
          Nueva transferencia
        </button>
      </div>
      <p className="mb-6 text-sm text-steel">
        Movimiento de repuestos entre almacenes · pedidos del Asesor aún pendientes no se muestran aquí
      </p>

      <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
        {loading ? (
          <div className="p-12 text-center text-sm text-steel">Cargando transferencias...</div>
        ) : transfers.length === 0 ? (
          <div className="p-12 text-center text-sm text-steel">No hay órdenes de transferencia todavía.</div>
        ) : (
          <div className="divide-y divide-navy/5">
            {transfers.map((t) => {
              const next = NEXT_STATUS[t.status];
              return (
                <div key={t.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div>
                    <p className="font-mono text-sm font-semibold text-blue">
                      {t.code} <span className="font-sans text-xs font-normal text-steel">{t.lines.length} ítems</span>
                    </p>
                    <p className="flex items-center gap-1.5 text-sm text-navy">
                      {warehouseName(t.origin_warehouse_id)}
                      <ArrowRight className="h-3.5 w-3.5 text-steel" />
                      {warehouseName(t.destination_warehouse_id)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-display font-semibold text-navy">${t.total_cost.toFixed(2)}</span>
                    <span className="text-xs text-steel">
                      <ElapsedLabel transfer={t} />
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest ${STATUS_STYLES[t.status]}`}
                    >
                      {STATUS_LABELS[t.status]}
                    </span>
                    {next && (
                      <button
                        onClick={() => setStatus(t.id, next)}
                        className="rounded-full border border-navy/15 px-3 py-1.5 text-xs font-semibold text-navy transition hover:border-navy/40"
                      >
                        Marcar {STATUS_LABELS[next]}
                      </button>
                    )}
                    {(t.status === "pedido" || t.status === "en_proceso") && (
                      <button
                        onClick={() => setStatus(t.id, "cancelada")}
                        className="text-xs font-semibold text-red-500 hover:text-red-600"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CreateTransferModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        filialId={filialId ?? ""}
        warehouses={warehouses}
        onSubmit={(originId, destinationId, lines) => addTransfer(originId, destinationId, lines).then(() => undefined)}
        onCreateWarehouse={addWarehouse}
      />
    </div>
  );
}