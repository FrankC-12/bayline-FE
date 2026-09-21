"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, ArrowRight, Wrench } from "lucide-react";
import { useWarehouseScope } from "@/contexts/WarehouseContext";
import { useTransfers } from "@/hooks/useTransfers";
import { useServiceOrderPartRequests } from "@/hooks/useServiceOrderPartRequests";
import ErrorState from "@/components/common/ErrorState";
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
  const { filialId, warehouses, activeWarehouse, activeWarehouseId, createWarehouse } =
    useWarehouseScope();
  const { transfers, loading, error, addTransfer, setStatus, refresh } = useTransfers(filialId);
  const { requests: partRequests, loading: partRequestsLoading, acknowledge } =
    useServiceOrderPartRequests(filialId);
  const [createOpen, setCreateOpen] = useState(false);
  const warehouseName = (id: string) => warehouses.find((w) => w.id === id)?.name ?? "—";
  const visibleTransfers = activeWarehouseId
    ? transfers.filter(
        (transfer) =>
          transfer.origin_warehouse_id === activeWarehouseId ||
          transfer.destination_warehouse_id === activeWarehouseId
      )
    : [];

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
        {activeWarehouse
          ? `Movimientos con origen o destino en ${activeWarehouse.name}`
          : "Selecciona o crea un almacén en la barra izquierda"}
      </p>

      {!partRequestsLoading && partRequests.length > 0 && (
        <div className="mb-6 overflow-hidden rounded-2xl border border-navy/10 bg-white">
          <div className="border-b border-navy/10 px-6 py-3">
            <h2 className="font-display text-sm font-bold text-navy">
              Solicitudes desde Órdenes de Servicio
            </h2>
            <p className="text-xs text-steel">
              Repuestos ya despachados a un taller al marcar una ODT como &ldquo;Pedido&rdquo; — no requieren
              acción, son de solo consulta.
            </p>
          </div>
          <div className="divide-y divide-navy/5">
            {partRequests.map((request) => (
              <Link
                key={request.id}
                href={`/dashboard/servicios/${request.service_order_id}`}
                onClick={() => acknowledge(request.id)}
                className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-ash/60"
              >
                <div className="flex items-center gap-3">
                  <Wrench className="h-4 w-4 shrink-0 text-blue" />
                  <div>
                    <p className="flex items-center gap-2 text-sm font-semibold text-navy">
                      {request.service_order_code}
                      {!request.warehouse_seen && (
                        <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
                          Nuevo
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-steel">
                      {request.vehicle_label} ·{" "}
                      {request.lines.map((l) => `${l.quantity}x ${l.part_name}`).join(", ")}
                    </p>
                  </div>
                </div>
                {request.fulfilled_at && (
                  <span className="shrink-0 text-xs text-steel">
                    {new Date(request.fulfilled_at).toLocaleString("es-VE")}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
        {loading ? (
          <div className="p-12 text-center text-sm text-steel">Cargando transferencias...</div>
        ) : error ? (
          <ErrorState error={error} onRetry={refresh} compact />
        ) : visibleTransfers.length === 0 ? (
          <div className="p-12 text-center text-sm text-steel">No hay órdenes de transferencia todavía.</div>
        ) : (
          <div className="divide-y divide-navy/5">
            {visibleTransfers.map((t) => {
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
        initialOriginId={activeWarehouseId ?? undefined}
        onSubmit={(originId, destinationId, lines) => addTransfer(originId, destinationId, lines).then(() => undefined)}
        onCreateWarehouse={createWarehouse}
      />
    </div>
  );
}
