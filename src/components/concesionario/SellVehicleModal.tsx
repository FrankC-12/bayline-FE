"use client";

import { useEffect, useState } from "react";
import { X, Loader2, Search, Landmark, AlertTriangle } from "lucide-react";
import { useClients } from "@/hooks/useClients";
import { useUserDirectory } from "@/hooks/useUserDirectory";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import { useToast } from "@/contexts/ToastContext";
import ClientFormPanel from "@/components/clients/ClientFormPanel";
import type { Client } from "@/types/client";
import type { CreateClientInput } from "@/lib/api/clients";
import { getLatestExchangeRates, type VehicleSaleInput } from "@/lib/api/concesionario";
import type { DealershipVehicle } from "@/types/concesionario";
import { formatDocumentId } from "@/lib/format";

type PaymentMethod = "usd" | "bs" | "mixed";

const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: "usd", label: "Divisas (USD)" },
  { value: "mixed", label: "Mixto" },
  { value: "bs", label: "Bolívares" },
];

interface SellVehicleModalProps {
  open: boolean;
  onClose: () => void;
  filialId: string;
  vehicle: DealershipVehicle | null;
  onConfirm: (sale: VehicleSaleInput) => Promise<void>;
}

export default function SellVehicleModal({ open, onClose, filialId, vehicle, onConfirm }: SellVehicleModalProps) {
  const toast = useToast();
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [createClientOpen, setCreateClientOpen] = useState(false);
  const { clients, addClient } = useClients(filialId, clientSearch || undefined);
  const { users } = useUserDirectory({ filialId });
  const { canEdit: canAuthorizeBelowCost } = useModuleAccess("administracion");

  const [advisorId, setAdvisorId] = useState("");
  const [saleType, setSaleType] = useState("contado");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("usd");
  const [usdBaseInput, setUsdBaseInput] = useState("");
  const [bcvRate, setBcvRate] = useState<number | null>(null);
  const [belowCostNote, setBelowCostNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setPaymentMethod("usd");
    setUsdBaseInput("");
    setBelowCostNote("");
    void getLatestExchangeRates().then((rates) => {
      const usd = rates.find((rate) => rate.currency === "USD");
      if (usd) setBcvRate(usd.rate_ves);
    }).catch(() => undefined);
  }, [open]);

  async function handleCreateClient(input: CreateClientInput) {
    const created = await addClient(input);
    setSelectedClient(created);
    setClientSearch("");
  }

  const listPrice = vehicle?.cash_total ?? 0;
  const usdBase = paymentMethod === "usd" ? listPrice : paymentMethod === "bs" ? 0 : Number(usdBaseInput) || 0;
  const igtfPreview = vehicle ? (usdBase * vehicle.igtf_percentage) / 100 : 0;
  const totalToCharge = listPrice + igtfPreview;
  const needsBcvRate = paymentMethod !== "usd" && !bcvRate;

  // Mirrors the server's own comparison (final_price vs cost_price) closely
  // enough to gate the UI — the server is still the one that actually
  // decides and enforces it.
  const projectedFinalPrice = saleType === "financiado" ? vehicle?.price_financed ?? 0 : totalToCharge;
  const belowCost = vehicle?.cost_price != null && projectedFinalPrice < vehicle.cost_price;

  async function handleConfirm() {
    if (!selectedClient || !vehicle) {
      setError("Selecciona un cliente.");
      return;
    }
    if (saleType === "contado" && paymentMethod === "mixed" && (usdBase <= 0 || usdBase >= listPrice)) {
      setError("En pago mixto, el monto en USD debe ser mayor a cero y menor al precio de lista.");
      return;
    }
    if (belowCost) {
      if (!canAuthorizeBelowCost) {
        setError("Esta venta está por debajo del costo del vehículo y requiere autorización de un rol superior (Administración).");
        return;
      }
      if (!belowCostNote.trim()) {
        setError("Indica el motivo para autorizar la venta por debajo del costo.");
        return;
      }
    }
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm({
        client_name: selectedClient.full_name,
        client_document: `${selectedClient.document_type}-${selectedClient.document_number}`,
        advisor_user_id: advisorId || null,
        sale_type: saleType,
        payment_method: saleType === "contado" ? paymentMethod : null,
        usd_base: saleType === "contado" && paymentMethod === "mixed" ? usdBase : null,
        below_cost_override: belowCost,
        below_cost_override_note: belowCost ? belowCostNote.trim() : null,
      });
      setSelectedClient(null);
      setClientSearch("");
      setAdvisorId("");
      setSaleType("contado");
      setBelowCostNote("");
      toast.success(`Venta registrada — ${vehicle.brand} ${vehicle.model} marcado como vendido.`);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar la venta.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open || !vehicle) return null;
  const symbol = vehicle.price_currency === "VES" ? "Bs." : "$";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-navy/40" />
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-navy/10 px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-bold text-navy">Marcar como Vendido</h2>
            <p className="text-xs text-steel">
              {vehicle.brand} {vehicle.model} {vehicle.year} · {vehicle.vin}
            </p>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="rounded-lg p-2 text-steel hover:bg-ash hover:text-navy">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Cliente</label>
            {selectedClient ? (
              <div className="flex items-center justify-between rounded-xl border border-navy/10 bg-ash px-4 py-3">
                <div>
                  <p className="font-medium text-navy">{selectedClient.full_name}</p>
                  <p className="font-mono text-xs text-steel">
                    {formatDocumentId(selectedClient.document_type, selectedClient.document_number)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedClient(null)}
                  className="text-xs font-semibold text-blue hover:text-navy"
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <div>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" />
                  <input
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    placeholder="Buscar por nombre o cédula/RIF..."
                    className="w-full rounded-xl border border-navy/15 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-blue"
                  />
                </div>
                {clientSearch && (
                  <div className="mt-2 divide-y divide-navy/5 rounded-xl border border-navy/10">
                    {clients.length > 0 ? (
                      clients.slice(0, 6).map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setSelectedClient(c);
                            setClientSearch("");
                          }}
                          className="block w-full px-4 py-2.5 text-left text-sm hover:bg-ash"
                        >
                          <p className="font-medium text-navy">{c.full_name}</p>
                          <p className="font-mono text-xs text-steel">
                            {formatDocumentId(c.document_type, c.document_number)}
                          </p>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-steel">No se encontró ningún cliente.</div>
                    )}
                    <button
                      type="button"
                      onClick={() => setCreateClientOpen(true)}
                      className="block w-full px-4 py-2.5 text-left text-sm font-semibold text-blue hover:bg-blue-light"
                    >
                      + Crear nuevo cliente
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Asesor</label>
            <select
              value={advisorId}
              onChange={(e) => setAdvisorId(e.target.value)}
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
            >
              <option value="">Sin asignar</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Tipo de venta</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSaleType("contado")}
                className={`rounded-xl border p-3 text-left text-sm transition ${
                  saleType === "contado" ? "border-blue bg-blue-light/40" : "border-navy/15 hover:border-blue/40"
                }`}
              >
                <p className="font-semibold text-navy">Contado</p>
                <p className="mt-0.5 text-xs text-steel">IVA e IGTF calculados sobre el precio, como en el resto del sistema.</p>
              </button>
              <button
                type="button"
                onClick={() => setSaleType("financiado")}
                className={`rounded-xl border p-3 text-left text-sm transition ${
                  saleType === "financiado" ? "border-blue bg-blue-light/40" : "border-navy/15 hover:border-blue/40"
                }`}
              >
                <p className="font-semibold text-navy">Financiamiento</p>
                <p className="mt-0.5 text-xs text-steel">Se gestiona con el proveedor de financiamiento.</p>
              </button>
            </div>
          </div>

          {saleType === "contado" ? (
            <>
              <div className="rounded-xl border border-navy/10 p-4">
                <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-steel">Precio de lista</p>
                <dl className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-steel">
                    <dt>PVP contado</dt>
                    <dd className="font-medium text-navy">{symbol} {vehicle.price_cash.toFixed(2)}</dd>
                  </div>
                  <div className="flex justify-between text-steel">
                    <dt>IVA ({vehicle.iva_percentage}%)</dt>
                    <dd className="font-medium text-navy">{symbol} {vehicle.iva_amount.toFixed(2)}</dd>
                  </div>
                  {vehicle.luxury_tax_percentage > 0 && (
                    <div className="flex justify-between text-steel">
                      <dt>Impuesto al lujo ({vehicle.luxury_tax_percentage}%)</dt>
                      <dd className="font-medium text-navy">{symbol} {vehicle.luxury_tax_amount.toFixed(2)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-navy/10 pt-1.5 font-bold text-navy">
                    <dt>Precio de lista</dt>
                    <dd>{symbol} {listPrice.toFixed(2)}</dd>
                  </div>
                </dl>
                <p className="mt-2 text-xs text-steel">No incluye IGTF — se calcula al cobrar, según cuánto se pague en divisas.</p>
              </div>

              <div className="rounded-xl border border-navy/10 p-4">
                <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-steel">¿Cómo se cobra?</p>
                <div className="grid grid-cols-3 gap-2">
                  {PAYMENT_METHOD_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPaymentMethod(opt.value)}
                      className={`rounded-lg border px-2 py-2 text-xs font-semibold transition ${
                        paymentMethod === opt.value ? "border-blue bg-blue-light/40 text-navy" : "border-navy/15 text-steel hover:border-blue/40"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {paymentMethod === "mixed" && (
                  <div className="mt-3">
                    <label className="mb-1.5 block text-xs font-medium text-navy">Monto pagado en USD</label>
                    <input
                      inputMode="decimal"
                      value={usdBaseInput}
                      onChange={(e) => setUsdBaseInput(e.target.value)}
                      placeholder="0.00"
                      className="w-full rounded-lg border border-navy/15 px-3 py-2 text-sm outline-none focus:border-blue"
                    />
                  </div>
                )}

                {needsBcvRate && (
                  <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>No hay tasa BCV del día registrada — actualízala antes de cobrar en bolívares.</p>
                  </div>
                )}

                <dl className="mt-3 space-y-1.5 border-t border-navy/10 pt-3 text-sm">
                  <div className="flex justify-between text-steel">
                    <dt>IGTF ({vehicle.igtf_percentage}% sobre {symbol} {usdBase.toFixed(2)} en divisas)</dt>
                    <dd className="font-medium text-navy">{symbol} {igtfPreview.toFixed(2)}</dd>
                  </div>
                  <div className="flex justify-between pt-1 font-bold text-navy">
                    <dt>Total a cobrar</dt>
                    <dd>{symbol} {totalToCharge.toFixed(2)}</dd>
                  </div>
                </dl>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-navy/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-steel">Precio financiado</p>
                  <p className="font-display text-lg font-bold text-navy">{symbol} {vehicle.price_financed.toFixed(2)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => toast.info("Próximamente: esto se conectará con el proveedor de financiamiento por webhook.")}
                  className="flex items-center gap-1.5 rounded-full border border-navy/15 px-4 py-2 text-xs font-semibold text-navy transition hover:border-blue hover:text-blue"
                >
                  <Landmark className="h-3.5 w-3.5" />
                  Conectar con financiamiento
                </button>
              </div>
              <p className="mt-2 text-xs text-steel">
                El proveedor actual es <span className="font-medium text-navy">{vehicle.financing_provider ?? "sin asignar"}</span>.
                Las condiciones del crédito se gestionan directamente con el financista.
              </p>
            </div>
          )}

          {belowCost && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  El precio de venta ({symbol} {projectedFinalPrice.toFixed(2)}) está por debajo del costo del
                  vehículo ({symbol} {Number(vehicle.cost_price ?? 0).toFixed(2)}).
                </p>
              </div>
              {canAuthorizeBelowCost ? (
                <div className="mt-3">
                  <label className="mb-1.5 block text-xs font-medium text-navy">
                    Motivo de la autorización *
                  </label>
                  <textarea
                    value={belowCostNote}
                    onChange={(e) => setBelowCostNote(e.target.value)}
                    placeholder="Ej: liquidación de inventario, autorizado por gerencia."
                    rows={2}
                    className="w-full rounded-lg border border-navy/15 bg-white px-3 py-2 text-sm outline-none focus:border-blue"
                  />
                </div>
              ) : (
                <p className="mt-2 font-semibold">
                  Requiere autorización de un rol superior (Administración) para continuar.
                </p>
              )}
            </div>
          )}

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting || (belowCost && !canAuthorizeBelowCost)}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {belowCost ? "Autorizar y confirmar venta" : "Confirmar venta"}
          </button>
        </div>
      </div>

      {filialId && (
        <ClientFormPanel
          open={createClientOpen}
          onClose={() => setCreateClientOpen(false)}
          filialId={filialId}
          onSubmit={handleCreateClient}
          editingClient={null}
        />
      )}
    </div>
  );
}
