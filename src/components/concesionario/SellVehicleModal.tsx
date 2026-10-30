"use client";

import { salesAccounts, type SalesAccount } from "@/lib/api/opportunities";
import { useAuth } from "@/contexts/AuthContext";
import {
  vehicleSaleDraftStorage,
  vehicleSaleDraftKey,
  readVehicleSaleDraft,
} from "@/lib/vehicle-sale-draft";
import { downloadBlob } from "@/lib/download";
import {
  getVehicleSalePdf,
  getVehicleSaleForVehicle,
} from "@/lib/api/concesionario";
import { NumberInput } from "@/components/ui/NumberInput";

import { useEffect, useState } from "react";
import { X, Loader2, Search, AlertTriangle } from "lucide-react";
import { useClients } from "@/hooks/useClients";
import { useVehicleSalesAdvisors } from "@/hooks/useVehicleSalesAdvisors";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import { useToast } from "@/contexts/ToastContext";
import ClientFormPanel from "@/components/clients/ClientFormPanel";
import type { Client } from "@/types/client";
import type { CreateClientInput } from "@/lib/api/clients";
import {
  getLatestExchangeRates,
  type VehicleSaleInput,
} from "@/lib/api/concesionario";
import type { DealershipVehicle } from "@/types/concesionario";
import { formatDocumentId, formatMoney, formatCount } from "@/lib/format";

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
  initialClient?: Client | null;
  quote?: {
    id: string;
    version: number;
    amount: number | null;
    sale_type: string;
    depositAmount?: number;
    workflowEnabled?: boolean;
  };
  vehicle: DealershipVehicle | null;
  onConfirm: (sale: VehicleSaleInput) => Promise<void>;
}

export default function SellVehicleModal({
  open,
  onClose,
  filialId,
  vehicle,
  initialClient,
  quote,
  onConfirm,
}: SellVehicleModalProps) {
  const { currentUser } = useAuth();
  const [accounts, setAccounts] = useState<SalesAccount[]>([]);
  const [usdAccount, setUsdAccount] = useState("");
  const [bsAccount, setBsAccount] = useState("");
  useEffect(() => {
    let active = true;
    if (open && quote?.workflowEnabled)
      salesAccounts(filialId)
        .then((v) => {
          if (active) setAccounts(v);
        })
        .catch(() => {
          if (active)
            setError("No se pudieron consultar las cuentas del cobro.");
        });
    return () => {
      active = false;
    };
  }, [open, filialId, quote?.workflowEnabled]);

  const draftKey =
    vehicle && currentUser
      ? vehicleSaleDraftKey(currentUser.userId, filialId, vehicle.id)
      : null;
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [restoredClientId, setRestoredClientId] = useState<string | null>(null);
  const [saleCompleted, setSaleCompleted] = useState(false);
  const [draftAvailable, setDraftAvailable] = useState(true);
  async function downloadInvoice() {
    if (!vehicle) return;
    setSubmitting(true);
    setError(null);
    try {
      const sale = await getVehicleSaleForVehicle(vehicle.id);
      downloadBlob(
        await getVehicleSalePdf(sale.id),
        `factura-${sale.code}.pdf`,
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo descargar la factura.",
      );
    } finally {
      setSubmitting(false);
    }
  }
  const toast = useToast();
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [createClientOpen, setCreateClientOpen] = useState(false);
  const { clients, addClient } = useClients(
    filialId,
    clientSearch || undefined,
  );
  const {
    users,
    loading: advisorsLoading,
    error: advisorsError,
    refresh: refreshAdvisors,
  } = useVehicleSalesAdvisors(filialId);
  const { canEdit: canAuthorizeBelowCost } = useModuleAccess("administracion");

  const [advisorId, setAdvisorId] = useState("");
  const [saleType, setSaleType] = useState("contado");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("usd");
  const [usdChannel, setUsdChannel] = useState<
    NonNullable<VehicleSaleInput["usd_payment_channel"]> | ""
  >("");
  const [bsChannel, setBsChannel] = useState<
    NonNullable<VehicleSaleInput["bs_payment_channel"]> | ""
  >("");
  const [usdBaseInput, setUsdBaseInput] = useState("");
  const [bcvRate, setBcvRate] = useState<number | null>(null);
  const [belowCostNote, setBelowCostNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setLoadedKey(null);
      return;
    }
    setSaleCompleted(false);
    setBcvRate(null);
    setSaleType(quote?.sale_type || "contado");
    setSelectedClient(initialClient ?? null);
    setAdvisorId(
      vehicle?.status === "reservado"
        ? (vehicle.reserved_by_user_id ?? "")
        : "",
    );
    setClientSearch("");
    setError(null);
    setPaymentMethod("usd");
    setUsdChannel("");
    setBsChannel("");
    setUsdBaseInput("");
    setBelowCostNote("");
    setRestoredClientId(null);
    try {
      const draft = draftKey
        ? readVehicleSaleDraft(vehicleSaleDraftStorage(), draftKey)
        : null;
      if (draft) {
        setRestoredClientId(
          initialClient?.id ??
            (vehicle?.status === "reservado" ? null : draft.clientId),
        );
        setAdvisorId(
          vehicle?.status === "reservado"
            ? (vehicle.reserved_by_user_id ?? "")
            : (draft.advisorId ?? ""),
        );
        setSaleType(
          quote?.sale_type ||
            (draft.saleType === "financiado" ? "financiado" : "contado"),
        );
        setPaymentMethod(
          ["usd", "bs", "mixed"].includes(draft.paymentMethod)
            ? draft.paymentMethod
            : "usd",
        );
        setUsdBaseInput(String(draft.usdBaseInput ?? ""));
        setUsdChannel(
          ["cash", "binance", "paypal", "zelle"].includes(draft.usdChannel)
            ? draft.usdChannel
            : "",
        );
        setBsChannel(
          ["pago_movil", "transferencia"].includes(draft.bsChannel)
            ? draft.bsChannel
            : "",
        );
        setBelowCostNote(String(draft.belowCostNote ?? ""));
      }
      setDraftAvailable(!!vehicleSaleDraftStorage());
    } catch {
      setDraftAvailable(false);
    }
    setLoadedKey(draftKey);
    void getLatestExchangeRates()
      .then((rates) => {
        const usd = rates.find((rate) => rate.currency === "USD");
        if (usd) setBcvRate(usd.rate_ves);
      })
      .catch(() => undefined);
  }, [
    open,
    vehicle?.id,
    vehicle?.status,
    vehicle?.reserved_by_user_id,
    draftKey,
    initialClient,
    quote?.sale_type,
  ]);

  useEffect(() => {
    if (open && vehicle?.status === "reservado") {
      setSelectedClient(
        clients.find((c) => c.id === vehicle.reserved_client_id) ?? null,
      );
    }
  }, [
    open,
    vehicle?.id,
    vehicle?.status,
    vehicle?.reserved_client_id,
    clients,
  ]);

  useEffect(() => {
    if (open && restoredClientId)
      setSelectedClient(
        clients.find((client) => client.id === restoredClientId) ?? null,
      );
  }, [open, restoredClientId, clients]);
  useEffect(() => {
    if (!open || !draftKey || loadedKey !== draftKey || saleCompleted) return;
    try {
      const storage = vehicleSaleDraftStorage();
      if (!storage) return;
      storage.setItem(
        draftKey,
        JSON.stringify({
          version: 1,
          savedAt: Date.now(),
          clientId: selectedClient?.id ?? restoredClientId,
          advisorId,
          saleType,
          paymentMethod,
          usdBaseInput,
          usdChannel,
          bsChannel,
          belowCostNote,
        }),
      );
    } catch {
      setDraftAvailable(false);
    }
  }, [
    open,
    draftKey,
    loadedKey,
    saleCompleted,
    selectedClient?.id,
    restoredClientId,
    advisorId,
    saleType,
    paymentMethod,
    usdBaseInput,
    usdChannel,
    bsChannel,
    belowCostNote,
  ]);

  async function handleCreateClient(input: CreateClientInput) {
    const created = await addClient(input);
    setRestoredClientId(null);
    setSelectedClient(created);
    setClientSearch("");
  }

  const listPrice =
    quote?.sale_type === "contado"
      ? (quote.amount ?? vehicle?.cash_total ?? 0)
      : (vehicle?.cash_total ?? 0);
  const usdBase =
    paymentMethod === "usd"
      ? listPrice
      : paymentMethod === "bs"
        ? 0
        : Number(usdBaseInput) || 0;
  const igtfPreview = vehicle ? (usdBase * vehicle.igtf_percentage) / 100 : 0;
  const totalToCharge = listPrice + igtfPreview;
  const needsBcvRate = paymentMethod !== "usd" && !bcvRate;

  // Mirrors the server's own comparison (final_price vs cost_price) closely
  // enough to gate the UI — the server is still the one that actually
  // decides and enforces it.
  const projectedFinalPrice =
    saleType === "financiado"
      ? (quote?.amount ?? vehicle?.price_financed ?? 0)
      : totalToCharge;
  const belowCost =
    vehicle?.cost_price != null && projectedFinalPrice < vehicle.cost_price;

  async function handleConfirm() {
    if (!selectedClient || !vehicle) {
      setError("Selecciona un cliente.");
      return;
    }
    if (saleType === "contado" && needsBcvRate) {
      setError("Actualiza la tasa BCV antes de cobrar en bolívares.");
      return;
    }
    if (
      saleType === "contado" &&
      paymentMethod === "mixed" &&
      (usdBase <= 0 || usdBase >= listPrice)
    ) {
      setError(
        "En pago mixto, el monto en USD debe ser mayor a cero y menor al precio de lista.",
      );
      return;
    }
    if (belowCost) {
      if (!canAuthorizeBelowCost) {
        setError(
          "Esta venta está por debajo del costo del vehículo y requiere autorización de un rol superior (Administración).",
        );
        return;
      }
      if (!belowCostNote.trim()) {
        setError(
          "Indica el motivo para autorizar la venta por debajo del costo.",
        );
        return;
      }
    }
    if (
      saleType === "contado" &&
      ((paymentMethod !== "bs" && !usdChannel) ||
        (paymentMethod !== "usd" && !bsChannel))
    ) {
      setError("Selecciona cómo se pagó en cada moneda.");
      return;
    }
    if (!advisorId || !users.some((user) => user.id === advisorId)) {
      setError(
        "Selecciona un asesor de venta de vehículos activo de esta filial.",
      );
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm({
        usd_account_id: usdAccount || undefined,
        bs_account_id: bsAccount || undefined,
        opportunity_id: quote?.id,
        opportunity_version: quote?.version,
        client_id: selectedClient.id,
        client_name: selectedClient.full_name,
        client_document: `${selectedClient.document_type}-${selectedClient.document_number}`,
        advisor_user_id: advisorId,
        usd_payment_channel:
          saleType === "contado" && paymentMethod !== "bs"
            ? usdChannel || null
            : null,
        bs_payment_channel:
          saleType === "contado" && paymentMethod !== "usd"
            ? bsChannel || null
            : null,
        sale_type: saleType,
        payment_method: saleType === "contado" ? paymentMethod : null,
        usd_base:
          saleType === "contado" && paymentMethod === "mixed" ? usdBase : null,
        below_cost_override: belowCost,
        below_cost_override_note: belowCost ? belowCostNote.trim() : null,
      });
      setSaleCompleted(true);
      try {
        if (draftKey) vehicleSaleDraftStorage()?.removeItem(draftKey);
      } catch {}

      toast.success(
        `Venta registrada — ${vehicle.brand} ${vehicle.model} marcado como vendido.`,
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo registrar la venta.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!open || !vehicle) return null;
  if (saleCompleted)
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4">
        <section
          role="dialog"
          aria-modal="true"
          aria-label="Venta registrada"
          className="w-full max-w-lg space-y-5 rounded-2xl bg-white p-6"
        >
          <h2 className="text-xl font-bold text-navy">Venta registrada</h2>
          <p className="text-sm text-steel">
            {vehicle.brand} {vehicle.model} · {vehicle.vin}. La factura incluye
            la descripción registrada al vender y los métodos de pago.
          </p>
          {error && (
            <p role="alert" className="text-red-600">
              {error}
            </p>
          )}
          <button
            disabled={submitting}
            onClick={() => void downloadInvoice()}
            className="w-full rounded-full bg-blue p-3 font-semibold text-white"
          >
            {submitting ? "Preparando factura…" : "Descargar factura PDF"}
          </button>
          <button
            disabled={submitting}
            onClick={onClose}
            className="w-full rounded-full border p-3"
          >
            Finalizar
          </button>
        </section>
      </div>
    );
  const symbol = vehicle.price_currency === "VES" ? "Bs." : "$";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        onClick={() => {
          if (!submitting) onClose();
        }}
        className="absolute inset-0 bg-navy/40"
      />
      <div className="relative max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-navy/10 px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-bold text-navy">
              Marcar como Vendido
            </h2>
            <p className="text-xs text-steel">
              {vehicle.brand} {vehicle.model} {vehicle.year} · {vehicle.vin}
            </p>
          </div>
          <button
            disabled={submitting}
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-lg p-2 text-steel hover:bg-ash hover:text-navy"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          {vehicle.status === "reservado" && (
            <p className="rounded-xl bg-blue-light p-3 text-sm text-blue">
              Esta venta conserva el cliente y el vendedor de la reserva. Para
              cambiar de cliente, libera primero la reserva indicando un motivo.
            </p>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">
              Cliente
            </label>
            {selectedClient ? (
              <div className="flex items-center justify-between rounded-xl border border-navy/10 bg-ash px-4 py-3">
                <div>
                  <p className="font-medium text-navy">
                    {selectedClient.full_name}
                  </p>
                  <p className="font-mono text-xs text-steel">
                    {formatDocumentId(
                      selectedClient.document_type,
                      selectedClient.document_number,
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={
                    submitting ||
                    advisorsLoading ||
                    !!advisorsError ||
                    vehicle.status === "reservado"
                  }
                  onClick={() => {
                    setRestoredClientId(null);
                    setSelectedClient(null);
                  }}
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
                    disabled={vehicle.status === "reservado"}
                    onChange={(e) => setClientSearch(e.target.value)}
                    placeholder="Buscar por nombre o cédula/RIF..."
                    className="w-full rounded-xl border border-navy/15 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-blue"
                  />
                </div>
                {vehicle.status !== "reservado" && clientSearch && (
                  <div className="mt-2 divide-y divide-navy/5 rounded-xl border border-navy/10">
                    {clients.length > 0 ? (
                      clients.slice(0, 6).map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setRestoredClientId(null);
                            setSelectedClient(c);
                            setClientSearch("");
                          }}
                          className="block w-full px-4 py-2.5 text-left text-sm hover:bg-ash"
                        >
                          <p className="font-medium text-navy">{c.full_name}</p>
                          <p className="font-mono text-xs text-steel">
                            {formatDocumentId(
                              c.document_type,
                              c.document_number,
                            )}
                          </p>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-steel">
                        No se encontró ningún cliente.
                      </div>
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
            <p className="mb-3 text-xs text-steel">
              {draftAvailable
                ? "Borrador guardado en este navegador durante 24 horas. Puedes cerrar esta ventana y retomar la venta. No reserva el vehículo ni fija el precio."
                : "El navegador no permite guardar el borrador."}
            </p>
            <label
              htmlFor="vehicle-sale-advisor"
              className="mb-1.5 block text-sm font-medium text-navy"
            >
              Asesor de venta de vehículos
            </label>
            <select
              id="vehicle-sale-advisor"
              value={advisorId}
              disabled={
                submitting ||
                advisorsLoading ||
                !!advisorsError ||
                vehicle.status === "reservado"
              }
              onChange={(e) => setAdvisorId(e.target.value)}
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
            >
              <option value="">Selecciona un asesor (obligatorio)</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name}
                </option>
              ))}
            </select>
            {advisorsError ? (
              <p role="alert" className="mt-2 text-xs text-red-700">
                No se pudieron cargar los asesores.{" "}
                <button
                  type="button"
                  onClick={() => void refreshAdvisors()}
                  className="underline"
                >
                  Reintentar
                </button>
              </p>
            ) : (
              <p className="mt-1 text-[11px] text-steel">
                {advisorsLoading
                  ? "Cargando asesores…"
                  : users.length
                    ? "Solo asesores activos de venta de vehículos de esta filial."
                    : "No hay asesores de venta de vehículos activos en esta filial."}
              </p>
            )}
          </div>

          {quote?.workflowEnabled && saleType === "contado" && (
            <section className="space-y-3 rounded-xl bg-blue-light/40 p-4">
              <h3 className="text-sm font-semibold">Cuentas del cobro</h3>
              {paymentMethod !== "bs" && (
                <label className="block text-xs">
                  Cuenta USD
                  <select
                    value={usdAccount}
                    onChange={(e) => setUsdAccount(e.target.value)}
                    className="mt-1 w-full rounded-lg border p-2"
                  >
                    <option value="">Selecciona…</option>
                    {accounts
                      .filter((a) => a.currency === "usd")
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                  </select>
                </label>
              )}
              {paymentMethod !== "usd" && (
                <label className="block text-xs">
                  Cuenta Bs
                  <select
                    value={bsAccount}
                    onChange={(e) => setBsAccount(e.target.value)}
                    className="mt-1 w-full rounded-lg border p-2"
                  >
                    <option value="">Selecciona…</option>
                    {accounts
                      .filter((a) => a.currency === "bs")
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                  </select>
                </label>
              )}
              <p className="text-sm">
                Abono recibido: $ {formatMoney(quote.depositAmount || 0)}
              </p>
              <p className="text-sm font-semibold">
                Saldo equivalente por cobrar: ${" "}
                {formatMoney(
                  Math.max(0, totalToCharge - (quote.depositAmount || 0)),
                )}
              </p>
              <p className="text-xs text-steel">
                En pago mixto, el aporte USD total incluye el abono ya recibido.
                Solo el saldo se registra como nuevo ingreso.
              </p>
            </section>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">
              Tipo de venta
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={!!quote && quote.sale_type !== "contado"}
                onClick={() => setSaleType("contado")}
                className={`rounded-xl border p-3 text-left text-sm transition ${
                  saleType === "contado"
                    ? "border-blue bg-blue-light/40"
                    : "border-navy/15 hover:border-blue/40"
                }`}
              >
                <p className="font-semibold text-navy">Contado</p>
                <p className="mt-0.5 text-xs text-steel">
                  IVA e IGTF calculados sobre el precio, como en el resto del
                  sistema.
                </p>
              </button>
              <button
                type="button"
                disabled={!!quote && quote.sale_type !== "financiado"}
                onClick={() => setSaleType("financiado")}
                className={`rounded-xl border p-3 text-left text-sm transition ${
                  saleType === "financiado"
                    ? "border-blue bg-blue-light/40"
                    : "border-navy/15 hover:border-blue/40"
                }`}
              >
                <p className="font-semibold text-navy">Financiamiento</p>
                <p className="mt-0.5 text-xs text-steel">
                  Se gestiona con el proveedor de financiamiento.
                </p>
              </button>
            </div>
          </div>

          {saleType === "contado" ? (
            <>
              <div className="rounded-xl border border-navy/10 p-4">
                <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-steel">
                  Precio de lista
                </p>
                <dl className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-steel">
                    <dt>
                      {quote
                        ? "Cotización vigente (antes de IGTF)"
                        : "PVP contado"}
                    </dt>
                    <dd className="font-medium text-navy">
                      {symbol}{" "}
                      {formatMoney(quote?.amount ?? vehicle.price_cash)}
                    </dd>
                  </div>
                  {!quote && (
                    <div className="flex justify-between text-steel">
                      <dt>IVA ({formatCount(vehicle.iva_percentage)}%)</dt>
                      <dd className="font-medium text-navy">
                        {symbol} {formatMoney(vehicle.iva_amount)}
                      </dd>
                    </div>
                  )}
                  {!quote && vehicle.luxury_tax_percentage > 0 && (
                    <div className="flex justify-between text-steel">
                      <dt>
                        Impuesto al lujo (
                        {formatCount(vehicle.luxury_tax_percentage)}%)
                      </dt>
                      <dd className="font-medium text-navy">
                        {symbol} {formatMoney(vehicle.luxury_tax_amount)}
                      </dd>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-navy/10 pt-1.5 font-bold text-navy">
                    <dt>Precio de lista</dt>
                    <dd>
                      {symbol} {formatMoney(listPrice)}
                    </dd>
                  </div>
                </dl>
                <p className="mt-2 text-xs text-steel">
                  No incluye IGTF — se calcula al cobrar, según cuánto se pague
                  en divisas.
                </p>
              </div>

              <div className="rounded-xl border border-navy/10 p-4">
                <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-steel">
                  ¿Cómo se cobra?
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {PAYMENT_METHOD_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPaymentMethod(opt.value)}
                      className={`rounded-lg border px-2 py-2 text-xs font-semibold transition ${
                        paymentMethod === opt.value
                          ? "border-blue bg-blue-light/40 text-navy"
                          : "border-navy/15 text-steel hover:border-blue/40"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <div className="mt-3 grid gap-3">
                  {paymentMethod !== "bs" && (
                    <label className="text-xs font-medium text-navy">
                      Método de pago USD (obligatorio)
                      <select
                        value={usdChannel}
                        onChange={(event) =>
                          setUsdChannel(event.target.value as typeof usdChannel)
                        }
                        className="mt-1 block w-full rounded-lg border border-navy/15 p-2"
                        required
                      >
                        <option value="">Selecciona un método</option>
                        <option value="cash">Efectivo</option>
                        <option value="binance">Binance</option>
                        <option value="paypal">PayPal</option>
                        <option value="zelle">Zelle</option>
                      </select>
                    </label>
                  )}
                  {paymentMethod !== "usd" && (
                    <label className="text-xs font-medium text-navy">
                      Método de pago Bs (obligatorio)
                      <select
                        value={bsChannel}
                        onChange={(event) =>
                          setBsChannel(event.target.value as typeof bsChannel)
                        }
                        className="mt-1 block w-full rounded-lg border border-navy/15 p-2"
                        required
                      >
                        <option value="">Selecciona un método</option>
                        <option value="pago_movil">Pago móvil</option>
                        <option value="transferencia">Transferencia</option>
                      </select>
                    </label>
                  )}
                </div>
                {paymentMethod === "mixed" && (
                  <div className="mt-3">
                    <label className="mb-1.5 block text-xs font-medium text-navy">
                      Monto pagado en USD
                    </label>
                    <NumberInput
                      inputMode="decimal"
                      value={usdBaseInput}
                      onValueChange={(value) => setUsdBaseInput(value)}
                      placeholder="0,00"
                      className="w-full rounded-lg border border-navy/15 px-3 py-2 text-sm outline-none focus:border-blue"
                    />
                  </div>
                )}

                {needsBcvRate && (
                  <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>
                      No hay tasa BCV del día registrada — actualízala antes de
                      cobrar en bolívares.
                    </p>
                  </div>
                )}

                <dl className="mt-3 space-y-1.5 border-t border-navy/10 pt-3 text-sm">
                  <div className="flex justify-between text-steel">
                    <dt>
                      IGTF ({formatCount(vehicle.igtf_percentage)}% sobre{" "}
                      {symbol} {formatMoney(usdBase)} en divisas)
                    </dt>
                    <dd className="font-medium text-navy">
                      {symbol} {formatMoney(igtfPreview)}
                    </dd>
                  </div>
                  <div className="flex justify-between pt-1 font-bold text-navy">
                    <dt>Total a cobrar</dt>
                    <dd>
                      {symbol} {formatMoney(totalToCharge)}
                    </dd>
                  </div>
                </dl>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-navy/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-steel">Precio financiado</p>
                  <p className="font-display text-lg font-bold text-navy">
                    {symbol}{" "}
                    {formatMoney(quote?.amount ?? vehicle.price_financed)}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-xs text-steel">
                El proveedor actual es{" "}
                <span className="font-medium text-navy">
                  {vehicle.financing_provider ?? "sin asignar"}
                </span>
                . Al confirmar la venta podrás consultar su contrato, cuotas y
                pagos reportados en Concesionario → Financiamientos. La conexión
                externa se configura por separado.
              </p>
            </div>
          )}

          {belowCost && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  El precio de venta ({symbol}{" "}
                  {formatMoney(projectedFinalPrice)}) está por debajo del costo
                  del vehículo ({symbol}{" "}
                  {formatMoney(Number(vehicle.cost_price ?? 0))}).
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
                  Requiere autorización de un rol superior (Administración) para
                  continuar.
                </p>
              )}
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleConfirm}
            disabled={
              submitting ||
              !advisorId ||
              advisorsLoading ||
              !!advisorsError ||
              (belowCost && !canAuthorizeBelowCost)
            }
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
