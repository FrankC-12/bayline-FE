"use client";

import { formatCount } from "@/lib/format";
import { NumberInput } from "@/components/ui/NumberInput";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePayables } from "@/hooks/usePayables";
import { useAccounts } from "@/hooks/useAccounts";
import { useSuppliers } from "@/hooks/useSuppliers";
import { createExpenseEntry } from "@/lib/api/administracion";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import type { Payable } from "@/types/administracion";

const usd = (value: number) => `$${value.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const AGING_STYLES: Record<Payable["aging_bucket"], string> = {
  "0-30": "bg-emerald-100 text-emerald-700",
  "31-60": "bg-amber-100 text-amber-700",
  "61-90": "bg-orange-100 text-orange-700",
  "90+": "bg-red-100 text-red-700",
};

export default function PayablesView() {
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;
  const { payables, loading, error, refresh, removePaid } = usePayables(filialId);
  const { suppliers } = useSuppliers(filialId);
  const [paying, setPaying] = useState<Payable | null>(null);

  const supplierName = (id: string) => suppliers.find((s) => s.id === id)?.business_name ?? "—";

  return (
    <div>
      <h1 className="mb-2 font-display text-3xl font-bold text-navy">Cuentas por Pagar</h1>
      <p className="mb-4 text-sm text-steel">
        Órdenes de compra a proveedores ya conciliadas (recibidas en almacén) y todavía no pagadas.
      </p>

      <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
        {loading ? (
          <div className="p-12 text-center text-sm text-steel">Cargando cuentas por pagar...</div>
        ) : error ? (
          <ErrorState error={error} onRetry={refresh} compact />
        ) : payables.length === 0 ? (
          <EmptyState compact title="No hay cuentas por pagar pendientes." />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-navy/10 bg-ash">
              <tr>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Orden de compra</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Proveedor</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Monto</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Antigüedad</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel" />
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {payables.map((p) => (
                <tr key={p.purchase_request_id} className="transition hover:bg-ash/60">
                  <td className="px-6 py-4 font-mono text-blue">{p.code}</td>
                  <td className="px-6 py-4 font-medium text-navy">{p.supplier_name || supplierName(p.supplier_id)}</td>
                  <td className="px-6 py-4 font-semibold text-navy">{usd(p.total_amount)}</td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${AGING_STYLES[p.aging_bucket]}`}>
                      {formatCount(p.days_outstanding)} días ({p.aging_bucket})
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setPaying(p)}
                      className="rounded-full bg-blue px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-navy"
                    >
                      Registrar pago
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {paying && (
        <RegisterPaymentModal
          filialId={filialId}
          payable={paying}
          onClose={() => setPaying(null)}
          onPaid={() => {
            removePaid(paying.purchase_request_id);
            setPaying(null);
          }}
        />
      )}
    </div>
  );
}

function RegisterPaymentModal({
  filialId,
  payable,
  onClose,
  onPaid,
}: {
  filialId: string | null;
  payable: Payable;
  onClose: () => void;
  onPaid: () => void;
}) {
  const { accounts } = useAccounts(filialId);
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState(String(payable.total_amount));
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [reference, setReference] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!filialId || !accountId) {
      setError("Elige la cuenta desde la que se paga.");
      return;
    }
    const account = accounts.find((a) => a.id === accountId);
    if (!account) return;
    setSubmitting(true);
    setError(null);
    try {
      await createExpenseEntry({
        filial_id: filialId,
        entry_date: entryDate,
        category: "compras_proveedores",
        beneficiary: payable.supplier_name,
        description: `Pago ${payable.code}`,
        amount: Number(amount) || 0,
        currency: account.currency,
        account_id: accountId,
        counterparty_type: "proveedor",
        counterparty_supplier_id: payable.supplier_id,
        reference: reference || null,
        purchase_request_ids: [payable.purchase_request_id],
      });
      onPaid();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar el pago.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-navy/40" />
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-navy/10 px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-bold text-navy">Registrar pago</h2>
            <p className="text-xs text-steel">
              {payable.code} · {payable.supplier_name} · {usd(payable.total_amount)}
            </p>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="rounded-lg p-2 text-steel hover:bg-ash hover:text-navy">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Cuenta que paga</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
            >
              <option value="">Selecciona una cuenta...</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.currency.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">Monto</label>
              <NumberInput
                min="0"
                step="0.01"
                value={amount}
                onValueChange={(value) => setAmount(value)}
                className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">Fecha</label>
              <input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Referencia (opcional)</label>
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
            />
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Registrar pago
          </button>
        </div>
      </div>
    </div>
  );
}
