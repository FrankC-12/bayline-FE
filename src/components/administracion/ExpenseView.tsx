"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, X, Loader2, Paperclip, Undo2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import { useExpenseEntries } from "@/hooks/useExpenseEntries";
import { useAccounts } from "@/hooks/useAccounts";
import { useClients } from "@/hooks/useClients";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useLaborSettings } from "@/hooks/useLaborSettings";
import { usePurchaseRequests } from "@/hooks/usePurchaseRequests";
import { useUserDirectory } from "@/hooks/useUserDirectory";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import ReverseEntryModal from "./ReverseEntryModal";
import type { CreateExpenseEntryInput } from "@/lib/api/administracion";
import type { CounterpartyType, ExpenseCategory, ExpenseEntry } from "@/types/administracion";
import { formatEntryDate } from "@/lib/format";

const CATEGORY_OPTIONS: { value: ExpenseCategory; label: string }[] = [
  { value: "nomina_comisiones", label: "Nómina y Comisiones" },
  { value: "servicios", label: "Servicios" },
  { value: "compras_proveedores", label: "Compras a Proveedores" },
  { value: "alquiler", label: "Alquiler" },
  { value: "mantenimiento", label: "Mantenimiento" },
  { value: "marketing", label: "Marketing" },
  { value: "impuestos_tasas", label: "Impuestos y Tasas" },
  { value: "garantia_rechazada", label: "Garantía Rechazada" },
  { value: "otro", label: "Otro" },
];

const CATEGORY_STYLES: Record<ExpenseCategory, string> = {
  nomina_comisiones: "bg-blue-light text-blue",
  servicios: "bg-amber-100 text-amber-700",
  compras_proveedores: "bg-slate-100 text-slate-600",
  alquiler: "bg-orange-100 text-orange-700",
  mantenimiento: "bg-emerald-100 text-emerald-700",
  marketing: "bg-violet-100 text-violet-700",
  impuestos_tasas: "bg-red-100 text-red-700",
  garantia_rechazada: "bg-fuchsia-100 text-fuchsia-700",
  otro: "bg-gray-100 text-gray-600",
  transferencia_cuentas: "bg-indigo-100 text-indigo-700",
};

const COUNTERPARTY_LABELS: Record<CounterpartyType, string> = {
  cliente: "Cliente",
  proveedor: "Proveedor",
  tercero: "Tercero",
  socio: "Socio",
};

// A rejected supplier claim charged to the shop already has its own
// resolution flow — a manual expense must never substitute for it.
const REDIRECT_CATEGORIES: Record<string, { label: string; href: string }> = {
  garantia_rechazada: { label: "Reclamos a Proveedor", href: "/dashboard/administracion/reclamos" },
};

function categoryLabel(c: ExpenseCategory) {
  return CATEGORY_OPTIONS.find((o) => o.value === c)?.label ?? c;
}

export default function ExpenseView() {
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;
  const [search, setSearch] = useState("");
  const { entries, loading, error, addEntry, reverseEntry, refresh } = useExpenseEntries(filialId, search || undefined);
  const { accounts } = useAccounts(filialId);
  const { clients } = useClients(filialId);
  const { suppliers } = useSuppliers(filialId);
  const [createOpen, setCreateOpen] = useState(false);
  const [reversingId, setReversingId] = useState<string | null>(null);
  const [reversingEntry, setReversingEntry] = useState<ExpenseEntry | null>(null);
  const { canEdit: canCreateEgreso } = useModuleAccess("finanzas-egreso");
  const { canEdit: canReversar } = useModuleAccess("finanzas-reversar");
  const { users } = useUserDirectory({ filialId });

  const accountName = (id: string) => accounts.find((a) => a.id === id)?.name ?? "—";
  const registeredByName = (id: string | null) => (id ? users.find((u) => u.id === id)?.full_name ?? "—" : "—");
  const counterpartyLabel = (e: ExpenseEntry) => {
    if (!e.counterparty_type) return "—";
    if (e.counterparty_type === "cliente") return clients.find((c) => c.id === e.counterparty_client_id)?.full_name ?? "Cliente";
    if (e.counterparty_type === "proveedor") return suppliers.find((s) => s.id === e.counterparty_supplier_id)?.business_name ?? "Proveedor";
    return e.counterparty_name ?? COUNTERPARTY_LABELS[e.counterparty_type];
  };

  const reversedIds = useMemo(() => new Set(entries.map((e) => e.reverses_entry_id).filter(Boolean)), [entries]);

  const total = useMemo(() => {
    return entries.reduce((sum, e) => {
      const account = accounts.find((a) => a.id === e.account_id);
      if (!account) return sum;
      return sum + (account.currency === "usd" ? e.amount : 0);
    }, 0);
  }, [entries, accounts]);

  async function handleReverse(entry: ExpenseEntry, reason: string) {
    setReversingId(entry.id);
    try {
      await reverseEntry(entry.id, reason);
      setReversingEntry(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "No se pudo reversar el movimiento.");
    } finally {
      setReversingId(null);
    }
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold text-navy">Egresos</h1>
        {canCreateEgreso && (
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy"
          >
            <Plus className="h-4 w-4" />
            Registrar Egreso
          </button>
        )}
      </div>
      <p className="mb-4 text-sm text-steel">Registro de gastos y salidas de dinero del negocio</p>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por categoría, beneficiario, descripción, cuenta..."
            className="w-full rounded-full border border-navy/15 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
          />
        </div>
        <span className="whitespace-nowrap rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600">
          Total: ${total.toFixed(2)}
        </span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-navy/10 bg-white">
        {loading ? (
          <div className="p-12 text-center text-sm text-steel">Cargando egresos...</div>
        ) : error ? (
          <ErrorState error={error} onRetry={refresh} compact />
        ) : entries.length === 0 ? (
          <EmptyState
            compact
            title={search ? `Sin resultados para "${search}"` : "No hay egresos registrados."}
          />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-navy/10 bg-ash">
              <tr>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Fecha</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Categoría</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Beneficiario</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Descripción</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Contraparte</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Monto</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Cuenta</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Registrado por</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {entries.map((e) => (
                <tr key={e.id} className="transition hover:bg-ash/60">
                  <td className="px-6 py-4 text-steel">{formatEntryDate(e.entry_date)}</td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${CATEGORY_STYLES[e.category]}`}>
                      {categoryLabel(e.category)}
                    </span>
                    {e.reverses_entry_id && (
                      <div className="mt-1">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                          <Undo2 className="h-3 w-3" /> Reverso
                        </span>
                        {e.reversal_reason && <p className="mt-0.5 text-xs italic text-steel">{e.reversal_reason}</p>}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-semibold text-navy">{e.beneficiary}</td>
                  <td className="px-6 py-4 text-steel">
                    {e.description}
                    {e.attachment_url && (
                      <a
                        href={e.attachment_url}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-blue hover:underline"
                      >
                        <Paperclip className="h-3 w-3" /> Soporte
                      </a>
                    )}
                  </td>
                  <td className="px-6 py-4 text-steel">{counterpartyLabel(e)}</td>
                  <td className="px-6 py-4 font-semibold text-navy">
                    {e.currency === "usd" ? `$${e.amount.toLocaleString()}` : `Bs. ${e.amount.toLocaleString()}`}
                  </td>
                  <td className="px-6 py-4 text-steel">{accountName(e.account_id)}</td>
                  <td className="px-6 py-4 text-steel">{registeredByName(e.registered_by_user_id)}</td>
                  <td className="px-6 py-4">
                    {!e.reverses_entry_id && !reversedIds.has(e.id) && canReversar && (
                      <button
                        onClick={() => setReversingEntry(e)}
                        disabled={reversingId === e.id}
                        className="inline-flex items-center gap-1 rounded-full border border-navy/15 px-3 py-1.5 text-xs font-semibold text-navy transition hover:bg-ash disabled:opacity-50"
                      >
                        {reversingId === e.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Undo2 className="h-3 w-3" />}
                        Reversar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {filialId && <CreateExpenseModal open={createOpen} onClose={() => setCreateOpen(false)} onSubmit={addEntry} />}

      {reversingEntry && (
        <ReverseEntryModal
          description={`${reversingEntry.beneficiary} · ${reversingEntry.description}`}
          submitting={reversingId === reversingEntry.id}
          onClose={() => setReversingEntry(null)}
          onConfirm={(reason) => handleReverse(reversingEntry, reason)}
        />
      )}
    </div>
  );
}

function CreateExpenseModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: Omit<CreateExpenseEntryInput, "filial_id">) => Promise<unknown>;
}) {
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;
  const { accounts } = useAccounts(filialId);
  const { settings: laborSettings } = useLaborSettings(filialId);

  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState<ExpenseCategory>("servicios");
  const [beneficiary, setBeneficiary] = useState("");
  const [currency, setCurrency] = useState("bs");
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [description, setDescription] = useState("");
  const [reference, setReference] = useState("");
  const [counterpartyType, setCounterpartyType] = useState<CounterpartyType>("proveedor");
  const [counterpartyClientId, setCounterpartyClientId] = useState("");
  const [counterpartySupplierId, setCounterpartySupplierId] = useState("");
  const [counterpartyName, setCounterpartyName] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const { clients } = useClients(filialId, clientSearch || undefined);
  const { suppliers } = useSuppliers(filialId);
  const { requests: purchaseRequests } = usePurchaseRequests(filialId);
  const [selectedPurchaseRequestIds, setSelectedPurchaseRequestIds] = useState<string[]>([]);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only orders from the chosen supplier that are conciliada and unpaid —
  // the same set Cuentas por Pagar would show for that supplier.
  const payablePurchaseRequests =
    category === "compras_proveedores" && counterpartyType === "proveedor" && counterpartySupplierId
      ? purchaseRequests.filter(
          (r) => r.supplier_id === counterpartySupplierId && r.status === "conciliada" && !r.paid_at
        )
      : [];

  const threshold = laborSettings?.manual_movement_attachment_threshold_usd ?? 0;
  // The threshold is USD-denominated — a Bs amount must be converted at the
  // current BCV rate before comparing, or e.g. Bs 50.000 (~$58) would be
  // compared against 100 as if it were $50.000.
  const amountUsd =
    currency === "usd" ? Number(amount || 0) : Number(amount || 0) / (laborSettings?.bcv_rate || 1);
  const attachmentRequired = amountUsd >= threshold && threshold > 0;
  const redirect = REDIRECT_CATEGORIES[category];

  async function handleSubmit() {
    if (!entryDate || !beneficiary.trim() || !amount || !accountId || !description.trim()) {
      setError("Completa todos los campos obligatorios.");
      return;
    }
    if (counterpartyType === "cliente" && !counterpartyClientId) {
      setError("Selecciona el cliente contraparte.");
      return;
    }
    if (counterpartyType === "proveedor" && !counterpartySupplierId) {
      setError("Selecciona el proveedor contraparte.");
      return;
    }
    if ((counterpartyType === "tercero" || counterpartyType === "socio") && !counterpartyName.trim()) {
      setError("Escribe el nombre de la contraparte.");
      return;
    }
    if (attachmentRequired && !attachment) {
      setError(`Los movimientos de $${threshold.toFixed(2)} o más requieren un soporte adjunto.`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        entry_date: entryDate,
        category,
        beneficiary,
        description,
        amount: Number(amount),
        currency,
        account_id: accountId,
        counterparty_type: counterpartyType,
        counterparty_client_id: counterpartyType === "cliente" ? counterpartyClientId : null,
        counterparty_supplier_id: counterpartyType === "proveedor" ? counterpartySupplierId : null,
        counterparty_name: counterpartyType === "tercero" || counterpartyType === "socio" ? counterpartyName : null,
        reference: reference || null,
        purchase_request_ids: payablePurchaseRequests.length > 0 ? selectedPurchaseRequestIds : undefined,
        attachment,
      });
      setBeneficiary("");
      setAmount("");
      setDescription("");
      setReference("");
      setCounterpartyName("");
      setSelectedPurchaseRequestIds([]);
      setAttachment(null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar el egreso.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-navy/40" />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-navy/10 px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-bold text-navy">Registrar Egreso</h2>
            <p className="text-xs text-steel">Los campos marcados con * son obligatorios</p>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="rounded-lg p-2 text-steel hover:bg-ash hover:text-navy">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">Fecha *</label>
              <input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
              />
              <p className="mt-1 text-xs text-steel">Solo se puede registrar dentro del mes en curso.</p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">Categoría *</label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value as ExpenseCategory);
                  setSelectedPurchaseRequestIds([]);
                }}
                className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
              >
                {CATEGORY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {redirect ? (
            <div className="flex items-start gap-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Esta categoría tiene su propio flujo — un egreso manual no lo reemplaza. Ve a{" "}
                <Link href={redirect.href} className="font-semibold underline">
                  {redirect.label}
                </Link>{" "}
                para registrarlo correctamente.
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy">Beneficiario *</label>
                <input
                  value={beneficiary}
                  onChange={(e) => setBeneficiary(e.target.value)}
                  placeholder="Proveedor, empleado o institución"
                  className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-navy">Moneda *</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
                  >
                    <option value="bs">Bs</option>
                    <option value="usd">USD</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-navy">Monto *</label>
                  <input
                    type="number"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy">Cuenta origen *</label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
                >
                  <option value="">Selecciona...</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.currency === "usd" ? "USD" : "Bs"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy">Contraparte *</label>
                <select
                  value={counterpartyType}
                  onChange={(e) => setCounterpartyType(e.target.value as CounterpartyType)}
                  className="mb-2 w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
                >
                  <option value="proveedor">Proveedor</option>
                  <option value="cliente">Cliente</option>
                  <option value="tercero">Tercero</option>
                  <option value="socio">Socio</option>
                </select>
                {counterpartyType === "cliente" && (
                  <>
                    <input
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      placeholder="Buscar cliente..."
                      className="mb-2 w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
                    />
                    <select
                      value={counterpartyClientId}
                      onChange={(e) => setCounterpartyClientId(e.target.value)}
                      className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
                    >
                      <option value="">Selecciona el cliente...</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.full_name} ({c.document_number})
                        </option>
                      ))}
                    </select>
                  </>
                )}
                {counterpartyType === "proveedor" && (
                  <select
                    value={counterpartySupplierId}
                    onChange={(e) => {
                      setCounterpartySupplierId(e.target.value);
                      setSelectedPurchaseRequestIds([]);
                    }}
                    className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
                  >
                    <option value="">Selecciona el proveedor...</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.business_name}
                      </option>
                    ))}
                  </select>
                )}
                {payablePurchaseRequests.length > 0 && (
                  <div className="rounded-xl border border-navy/10 p-3">
                    <p className="mb-2 text-xs font-medium text-navy">
                      Aplicar este pago a órdenes de compra (Cuentas por Pagar)
                    </p>
                    <div className="max-h-32 space-y-1.5 overflow-y-auto">
                      {payablePurchaseRequests.map((r) => (
                        <label key={r.id} className="flex items-center gap-2 text-sm text-navy">
                          <input
                            type="checkbox"
                            checked={selectedPurchaseRequestIds.includes(r.id)}
                            onChange={(e) =>
                              setSelectedPurchaseRequestIds((prev) =>
                                e.target.checked ? [...prev, r.id] : prev.filter((id) => id !== r.id)
                              )
                            }
                          />
                          <span className="font-mono text-blue">{r.code}</span>
                          {r.total_quoted != null && (
                            <span className="text-steel">${r.total_quoted.toFixed(2)}</span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                {(counterpartyType === "tercero" || counterpartyType === "socio") && (
                  <input
                    value={counterpartyName}
                    onChange={(e) => setCounterpartyName(e.target.value)}
                    placeholder="Nombre de la contraparte"
                    className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
                  />
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy">Referencia</label>
                <input
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="N° de transferencia o comprobante"
                  className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy">Descripción *</label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Quincena agosto · personal de taller"
                  className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy">
                  Adjunto {attachmentRequired ? "*" : ""}
                </label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setAttachment(e.target.files?.[0] ?? null)}
                  className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
                />
                {threshold > 0 && (
                  <p className="mt-1 text-xs text-steel">
                    Obligatorio para montos de ${threshold.toFixed(2)} o más.
                  </p>
                )}
              </div>

              {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Registrar egreso
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
