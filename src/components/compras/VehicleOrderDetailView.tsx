"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Plus, X, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import { useSuppliers } from "@/hooks/useSuppliers";
import {
  getVehiclePurchaseOrder,
  addVehicleOrderReception,
  addVehicleOrderInvoice,
  cancelVehiclePurchaseOrder,
} from "@/lib/api/compras";
import type { VehiclePurchaseOrderDetail, VehiclePurchaseOrderStatus } from "@/types/compras";

const STATUS_LABELS: Record<VehiclePurchaseOrderStatus, string> = {
  enviada: "Enviada, esperando recepción",
  parcialmente_recibida: "Parcialmente recibida",
  recibida: "Recibida",
  conciliada: "Conciliada",
  cancelada: "Cancelada",
};

const CANCELABLE_STATUSES: VehiclePurchaseOrderStatus[] = ["enviada", "parcialmente_recibida"];

interface UnitDraft {
  lineId: string;
  vin: string;
}

interface VehicleOrderDetailViewProps {
  orderId: string;
}

export default function VehicleOrderDetailView({ orderId }: VehicleOrderDetailViewProps) {
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;
  const { canEdit: canEditAdministracion } = useModuleAccess("administracion");

  const { suppliers } = useSuppliers(filialId);
  const supplierName = (id: string) => suppliers.find((s) => s.id === id)?.business_name ?? "—";

  const [order, setOrder] = useState<VehiclePurchaseOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [receptionOpen, setReceptionOpen] = useState(false);
  const [receptionUnits, setReceptionUnits] = useState<UnitDraft[]>([]);

  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [invoiceCurrency, setInvoiceCurrency] = useState("USD");
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [invoiceUnitIds, setInvoiceUnitIds] = useState<string[]>([]);

  async function load() {
    setLoading(true);
    try {
      const data = await getVehiclePurchaseOrder(orderId);
      setOrder(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const uninvoicedUnits = (order?.receptions ?? []).flatMap((r) => r.units).filter((u) => !u.purchase_order_invoice_id);

  function openReceptionModal() {
    setReceptionUnits(order?.lines.length ? [{ lineId: order.lines[0].id, vin: "" }] : []);
    setError(null);
    setReceptionOpen(true);
  }

  function openInvoiceModal() {
    setInvoiceUnitIds(uninvoicedUnits.map((u) => u.id));
    setInvoiceNumber("");
    setInvoiceAmount("");
    setInvoiceCurrency("USD");
    setInvoiceDate(new Date().toISOString().slice(0, 10));
    setError(null);
    setInvoiceOpen(true);
  }

  async function handleAddReception() {
    if (!order) return;
    const validUnits = receptionUnits.filter((u) => u.lineId && u.vin.trim());
    if (validUnits.length === 0) {
      setError("Agrega al menos una unidad con línea y VIN.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await addVehicleOrderReception(order.id, {
        units: validUnits.map((u) => ({ purchase_order_line_id: u.lineId, vin: u.vin.trim().toUpperCase() })),
      });
      setReceptionOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar la recepción.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddInvoice() {
    if (!order) return;
    if (!invoiceNumber.trim() || Number(invoiceAmount) <= 0 || invoiceUnitIds.length === 0) {
      setError("Ingresa un número de factura, un monto mayor a 0 y selecciona al menos una unidad.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await addVehicleOrderInvoice(order.id, {
        invoice_number: invoiceNumber.trim(),
        total_amount: Number(invoiceAmount),
        currency: invoiceCurrency,
        issued_at: invoiceDate,
        dealership_vehicle_ids: invoiceUnitIds,
      });
      setInvoiceOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar la factura.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel() {
    if (!order) return;
    setSubmitting(true);
    try {
      await cancelVehiclePurchaseOrder(order.id);
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !order) {
    return <div className="p-12 text-center text-sm text-steel">Cargando orden de compra...</div>;
  }

  const canReceive = order.status === "enviada" || order.status === "parcialmente_recibida";
  const canCancel = CANCELABLE_STATUSES.includes(order.status);

  return (
    <div>
      <Link
        href="/dashboard/compras/vehiculos"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-steel hover:text-navy"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver a órdenes de compra
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-navy">{order.code}</h1>
          <p className="mt-1 text-sm text-steel">{supplierName(order.supplier_id)}</p>
        </div>
        <span className="rounded-full bg-blue-light px-4 py-2 text-sm font-semibold text-blue">
          {STATUS_LABELS[order.status]}
        </span>
      </div>

      <div className="rounded-2xl border border-navy/10 bg-white p-6">
        <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-steel">Líneas del pedido</p>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-navy/10 text-steel">
              <th className="pb-2 font-mono text-[10px] uppercase tracking-widest">Marca / Modelo</th>
              <th className="pb-2 font-mono text-[10px] uppercase tracking-widest">Versión</th>
              <th className="pb-2 font-mono text-[10px] uppercase tracking-widest">Año</th>
              <th className="pb-2 font-mono text-[10px] uppercase tracking-widest">Color</th>
              <th className="pb-2 text-right font-mono text-[10px] uppercase tracking-widest">Recibido / Pedido</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {order.lines.map((line) => (
              <tr key={line.id}>
                <td className="py-2 font-medium text-navy">
                  {line.brand} {line.model}
                </td>
                <td className="py-2 text-steel">{line.version ?? "—"}</td>
                <td className="py-2 text-steel">{line.year}</td>
                <td className="py-2 text-steel">{line.color ?? "—"}</td>
                <td className="py-2 text-right font-semibold text-navy">
                  {line.quantity_received} / {line.quantity}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 rounded-2xl border border-navy/10 bg-white p-6">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-mono text-[11px] uppercase tracking-widest text-steel">Recepciones</p>
        </div>
        {order.receptions.length === 0 ? (
          <p className="text-sm text-steel">Todavía no se ha recibido ninguna unidad.</p>
        ) : (
          <div className="space-y-4">
            {order.receptions.map((reception) => (
              <div key={reception.id} className="rounded-xl border border-navy/10 p-4">
                <p className="mb-2 text-xs text-steel">
                  Recibido el {new Date(reception.received_at).toLocaleDateString("es-VE")}
                  {reception.notes ? ` · ${reception.notes}` : ""}
                </p>
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-navy/10 text-steel">
                      <th className="pb-2 font-mono text-[10px] uppercase tracking-widest">VIN</th>
                      <th className="pb-2 font-mono text-[10px] uppercase tracking-widest">Vehículo</th>
                      <th className="pb-2 text-right font-mono text-[10px] uppercase tracking-widest">Costo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy/5">
                    {reception.units.map((unit) => (
                      <tr key={unit.id}>
                        <td className="py-2 font-mono text-navy">{unit.vin}</td>
                        <td className="py-2 text-steel">
                          {unit.brand} {unit.model} {unit.year}
                        </td>
                        <td className="py-2 text-right">
                          {unit.cost_price != null ? (
                            <span className="font-semibold text-navy">${unit.cost_price.toFixed(2)}</span>
                          ) : (
                            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-amber-700">
                              Costo pendiente
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>

      {order.invoices.length > 0 && (
        <div className="mt-4 rounded-2xl border border-navy/10 bg-white p-6">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-steel">Facturas registradas</p>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-navy/10 text-steel">
                <th className="pb-2 font-mono text-[10px] uppercase tracking-widest">N.º Factura</th>
                <th className="pb-2 font-mono text-[10px] uppercase tracking-widest">Fecha</th>
                <th className="pb-2 font-mono text-[10px] uppercase tracking-widest">Unidades</th>
                <th className="pb-2 text-right font-mono text-[10px] uppercase tracking-widest">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {order.invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="py-2 font-mono text-navy">{inv.invoice_number}</td>
                  <td className="py-2 text-steel">{new Date(inv.issued_at).toLocaleDateString("es-VE")}</td>
                  <td className="py-2 text-steel">{inv.unit_count}</td>
                  <td className="py-2 text-right font-semibold text-navy">
                    {inv.currency} {inv.total_amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {canReceive && (
          <button
            onClick={openReceptionModal}
            className="rounded-full bg-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-navy"
          >
            Registrar recepción
          </button>
        )}
        {canEditAdministracion && uninvoicedUnits.length > 0 && (
          <button
            onClick={openInvoiceModal}
            className="rounded-full border border-navy/15 px-6 py-2.5 text-sm font-semibold text-navy transition hover:border-navy/40"
          >
            Registrar factura
          </button>
        )}
        {canCancel && (
          <button
            onClick={handleCancel}
            disabled={submitting}
            className="text-sm font-semibold text-red-500 hover:text-red-600"
          >
            Cancelar orden
          </button>
        )}
      </div>

      {receptionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-navy">Registrar recepción</h2>
              <button onClick={() => setReceptionOpen(false)} className="text-steel hover:text-navy">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              {receptionUnits.map((unit, i) => (
                <div key={i} className="flex items-center gap-2">
                  <select
                    value={unit.lineId}
                    onChange={(e) =>
                      setReceptionUnits((prev) => prev.map((u, idx) => (idx === i ? { ...u, lineId: e.target.value } : u)))
                    }
                    className="flex-1 rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none focus:border-blue"
                  >
                    {order.lines.map((line) => (
                      <option key={line.id} value={line.id}>
                        {line.brand} {line.model} {line.version ?? ""} ({line.quantity_received}/{line.quantity})
                      </option>
                    ))}
                  </select>
                  <input
                    value={unit.vin}
                    onChange={(e) =>
                      setReceptionUnits((prev) => prev.map((u, idx) => (idx === i ? { ...u, vin: e.target.value } : u)))
                    }
                    placeholder="VIN"
                    maxLength={17}
                    className="w-48 rounded-xl border border-navy/15 px-3 py-2.5 text-sm uppercase outline-none focus:border-blue"
                  />
                  <button
                    type="button"
                    onClick={() => setReceptionUnits((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev))}
                    className="rounded-xl border border-navy/15 p-2.5 text-red-500 transition hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() =>
                setReceptionUnits((prev) => [...prev, { lineId: order.lines[0]?.id ?? "", vin: "" }])
              }
              className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-blue hover:text-navy"
            >
              <Plus className="h-4 w-4" />
              Agregar unidad
            </button>

            {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setReceptionOpen(false)}
                className="rounded-full border border-navy/15 px-5 py-2.5 text-sm font-semibold text-navy"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddReception}
                disabled={submitting}
                className="flex items-center gap-2 rounded-full bg-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Guardar recepción
              </button>
            </div>
          </div>
        </div>
      )}

      {invoiceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-navy">Registrar factura</h2>
              <button onClick={() => setInvoiceOpen(false)} className="text-steel hover:text-navy">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy">N.º de factura</label>
                <input
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy">Fecha</label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy">Monto total</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy">Moneda</label>
                <select
                  value={invoiceCurrency}
                  onChange={(e) => setInvoiceCurrency(e.target.value)}
                  className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-navy">
                Unidades que cubre esta factura ({invoiceUnitIds.length} de {uninvoicedUnits.length})
              </p>
              <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-navy/10 p-3">
                {uninvoicedUnits.map((unit) => (
                  <label key={unit.id} className="flex items-center gap-2 text-sm text-navy">
                    <input
                      type="checkbox"
                      checked={invoiceUnitIds.includes(unit.id)}
                      onChange={(e) =>
                        setInvoiceUnitIds((prev) =>
                          e.target.checked ? [...prev, unit.id] : prev.filter((id) => id !== unit.id)
                        )
                      }
                    />
                    <span className="font-mono">{unit.vin}</span>
                    <span className="text-steel">
                      {unit.brand} {unit.model} {unit.year}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setInvoiceOpen(false)}
                className="rounded-full border border-navy/15 px-5 py-2.5 text-sm font-semibold text-navy"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddInvoice}
                disabled={submitting}
                className="flex items-center gap-2 rounded-full bg-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Guardar factura
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
