"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, ArrowRight, Wrench, ShoppingCart } from "lucide-react";
import { useWarehouseScope } from "@/contexts/WarehouseContext";
import { useTransfers } from "@/hooks/useTransfers";
import { useServiceOrderPartRequests } from "@/hooks/useServiceOrderPartRequests";
import { usePartSaleRequests } from "@/hooks/usePartSaleRequests";
import ErrorState from "@/components/common/ErrorState";
import CreateTransferModal from "./CreateTransferModal";
import { formatElapsed } from "@/lib/time";
import type {
  PartSaleRequestLine,
  ServiceOrderPartRequestLine,
  Transfer,
  TransferStatus,
} from "@/types/warehouse";

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

// A line isn't scoped to one warehouse — dispatch draws FIFO across every
// warehouse in the filial, so its quantity can (rarely) split across more
// than one. Shows just the name for the common single-warehouse case, or a
// per-warehouse quantity breakdown when it split.
function lineWarehouseLabel(line: ServiceOrderPartRequestLine): string | null {
  if (line.warehouses.length === 0) return null;
  if (line.warehouses.length === 1) return line.warehouses[0].warehouse_name;
  return line.warehouses.map((w) => `${w.warehouse_name}: ${w.quantity}`).join(" + ");
}

function partSaleLineLabel(line: PartSaleRequestLine): string {
  return `${line.quantity}x ${line.part_name}${line.warehouse_name ? ` (${line.warehouse_name})` : ""}`;
}

/** A dispatched ODT (taller) and a counter parts sale (venta de repuestos)
 * have completely different shapes — this is the one thing almacén staff
 * actually needs told apart at a glance: WHERE the picked parts have to be
 * sent. Mapped into one common row shape so both render in a single,
 * time-sorted list instead of two disconnected sections. */
interface WarehouseRequestRow {
  key: string;
  href: string;
  onClick?: () => void;
  destination: "taller" | "venta_repuestos";
  title: string;
  badge?: string;
  subtitle: string;
  timestamp: string | null;
  // Only taller (ODT) rows have a Pedido -> Completado step worth timing —
  // a counter that starts the moment it's marked Pedido and pauses the
  // moment almacén confirms Completado.
  counter?: { startedAt: string; endedAt: string | null; isRunning: boolean };
  onComplete?: () => void;
}

/** Same idea as ElapsedLabel below, generalized to any {start, end} pair —
 * ticks while running (isRunning), freezes once an end time is set. */
function RequestElapsedCounter({
  startedAt,
  endedAt,
  isRunning,
}: {
  startedAt: string;
  endedAt: string | null;
  isRunning: boolean;
}) {
  const [, forceTick] = useState(0);
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => forceTick((n) => n + 1), 30000);
    return () => clearInterval(id);
  }, [isRunning]);

  return <span>{formatElapsed(startedAt, endedAt)}</span>;
}

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
  const {
    requests: serviceOrderRequests,
    loading: serviceOrderRequestsLoading,
    acknowledge,
    complete,
  } = useServiceOrderPartRequests(filialId);
  const { requests: partSaleRequests, loading: partSaleRequestsLoading } = usePartSaleRequests(filialId);
  const [createOpen, setCreateOpen] = useState(false);

  const requestsLoading = serviceOrderRequestsLoading || partSaleRequestsLoading;
  const warehouseRequests: WarehouseRequestRow[] = [
    ...serviceOrderRequests.map(
      (request): WarehouseRequestRow => ({
        key: `taller-${request.id}`,
        href: `/dashboard/servicios/${request.service_order_id}`,
        onClick: () => acknowledge(request.id),
        destination: "taller",
        title: request.service_order_code,
        badge: !request.warehouse_seen ? "Nuevo" : undefined,
        subtitle: `${request.vehicle_label} · ${request.lines
          .map((l) => {
            const warehouseLabel = lineWarehouseLabel(l);
            return `${l.quantity}x ${l.part_name}${warehouseLabel ? ` (${warehouseLabel})` : ""}`;
          })
          .join(", ")}`,
        timestamp: request.fulfilled_at,
        counter: request.fulfilled_at
          ? { startedAt: request.fulfilled_at, endedAt: request.completed_at, isRunning: request.status === "pedido" }
          : undefined,
        onComplete: request.status === "pedido" ? () => complete(request.id) : undefined,
      })
    ),
    ...partSaleRequests.map(
      (request): WarehouseRequestRow => ({
        key: `venta-${request.id}`,
        href: `/dashboard/repuestos/ventas/${request.id}`,
        destination: "venta_repuestos",
        title: request.code,
        subtitle: `${request.client_name} · ${request.lines.map(partSaleLineLabel).join(", ")}`,
        timestamp: request.created_at,
      })
    ),
  ].sort((a, b) => (b.timestamp ?? "").localeCompare(a.timestamp ?? ""));
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

      {!requestsLoading && warehouseRequests.length > 0 && (
        <div className="mb-6 overflow-hidden rounded-2xl border border-navy/10 bg-white">
          <div className="border-b border-navy/10 px-6 py-3">
            <h2 className="font-display text-sm font-bold text-navy">Solicitudes de Repuestos</h2>
            <p className="text-xs text-steel">
              Repuestos ya despachados hacia un taller (ODS) o hacia el mostrador (venta de repuestos). Las de
              taller llevan un contador desde que se marcaron como Pedido — márcalas como Completado al
              entregarlas.
            </p>
          </div>
          <div className="divide-y divide-navy/5">
            {warehouseRequests.map((request) => (
              <div
                key={request.key}
                className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-ash/60"
              >
                <Link href={request.href} onClick={request.onClick} className="flex flex-1 items-center gap-3">
                  {request.destination === "taller" ? (
                    <Wrench className="h-4 w-4 shrink-0 text-blue" />
                  ) : (
                    <ShoppingCart className="h-4 w-4 shrink-0 text-emerald-600" />
                  )}
                  <div>
                    <p className="flex items-center gap-2 text-sm font-semibold text-navy">
                      {request.title}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                          request.destination === "taller"
                            ? "bg-blue-light text-blue"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {request.destination === "taller" ? "Taller" : "Venta de Repuestos"}
                      </span>
                      {request.badge && (
                        <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
                          {request.badge}
                        </span>
                      )}
                      {request.counter && !request.counter.isRunning && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-700">
                          Completado
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-steel">{request.subtitle}</p>
                  </div>
                </Link>
                <div className="flex shrink-0 items-center gap-3">
                  {request.counter && (
                    <span
                      className={`font-mono text-xs ${request.counter.isRunning ? "font-semibold text-amber-700" : "text-steel"}`}
                      title={request.counter.isRunning ? "Tiempo desde que se marcó como Pedido" : "Tiempo hasta que se completó"}
                    >
                      {request.counter.isRunning ? "⏱ " : ""}
                      <RequestElapsedCounter {...request.counter} />
                    </span>
                  )}
                  {request.onComplete && (
                    <button
                      type="button"
                      onClick={request.onComplete}
                      className="rounded-full border border-navy/15 px-3 py-1.5 text-xs font-semibold text-navy transition hover:border-blue hover:text-blue"
                    >
                      Marcar como Completado
                    </button>
                  )}
                  {request.timestamp && (
                    <span className="text-xs text-steel">
                      {new Date(request.timestamp).toLocaleString("es-VE")}
                    </span>
                  )}
                </div>
              </div>
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
