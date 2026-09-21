"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useReceivables } from "@/hooks/useReceivables";
import { useAccounts } from "@/hooks/useAccounts";
import type { Receivable } from "@/lib/api/serviceOrderBilling";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";

const usd = (value: number) => `$${value.toLocaleString("es-VE", { minimumFractionDigits: 2 })}`;

const AGING_STYLES: Record<Receivable["aging_bucket"], string> = {
  "0-30": "bg-emerald-100 text-emerald-700",
  "31-60": "bg-amber-100 text-amber-700",
  "61-90": "bg-orange-100 text-orange-700",
  "90+": "bg-red-100 text-red-700",
};

/** For an ODS invoice, shows which order it belongs to next to the invoice
 * code — a part sale's code already is the whole document, nothing to add. */
function documentLabel(r: Receivable): string | null {
  return r.document_type === "service_order_invoice" ? r.order_code : null;
}

export default function ReceivablesView() {
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;
  const { receivables, loading, error, collectOne, refresh } = useReceivables(filialId);
  const [collecting, setCollecting] = useState<Receivable | null>(null);

  return (
    <div>
      <h1 className="mb-2 font-display text-3xl font-bold text-navy">Cuentas por Cobrar</h1>
      <p className="mb-4 text-sm text-steel">
        Toda venta o factura emitida sin cobrar por completo — facturas de ODS pendientes de cobro y ventas de
        repuestos que aún no llegan a completado.
      </p>

      <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
        {loading ? (
          <div className="p-12 text-center text-sm text-steel">Cargando cuentas por cobrar...</div>
        ) : error ? (
          <ErrorState error={error} onRetry={refresh} compact />
        ) : receivables.length === 0 ? (
          <EmptyState compact title="No hay cuentas por cobrar pendientes." />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-navy/10 bg-ash">
              <tr>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Documento</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Cliente</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Total</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Retenido</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Pendiente</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Antigüedad</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel" />
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {receivables.map((r) => (
                <tr key={r.invoice_id} className="transition hover:bg-ash/60">
                  <td className="px-6 py-4">
                    <span className="font-mono text-blue">{r.code}</span>
                    {documentLabel(r) && <span className="ml-1.5 text-xs text-steel">· {documentLabel(r)}</span>}
                  </td>
                  <td className="px-6 py-4 font-medium text-navy">{r.billed_client_name}</td>
                  <td className="px-6 py-4 text-navy">{usd(r.total_usd)}</td>
                  <td className="px-6 py-4 text-steel">
                    {r.iva_retention_amount + r.islr_retention_amount > 0
                      ? usd(r.iva_retention_amount + r.islr_retention_amount)
                      : "—"}
                  </td>
                  <td className="px-6 py-4 font-semibold text-amber-700">{usd(r.pending_amount)}</td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${AGING_STYLES[r.aging_bucket]}`}>
                      {r.days_outstanding} días ({r.aging_bucket})
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {r.document_type === "service_order_invoice" ? (
                      <button
                        onClick={() => setCollecting(r)}
                        className="rounded-full bg-blue px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-navy"
                      >
                        Registrar cobro
                      </button>
                    ) : (
                      <Link
                        href={`/dashboard/repuestos/ventas/${r.invoice_id}`}
                        className="text-xs font-semibold text-blue hover:underline"
                      >
                        Ver venta
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {collecting && (
        <CollectModal receivable={collecting} onClose={() => setCollecting(null)} onSubmit={collectOne} />
      )}
    </div>
  );
}

function CollectModal({
  receivable,
  onClose,
  onSubmit,
}: {
  receivable: Receivable;
  onClose: () => void;
  onSubmit: (invoiceId: string, input: { account_id: string; withholding_amount: number; net_collected_amount: number }) => Promise<void>;
}) {
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;
  const { accounts } = useAccounts(filialId);
  const usdAccounts = accounts.filter((a) => a.currency === "usd");

  const [accountId, setAccountId] = useState("");
  const [withholding, setWithholding] = useState("0");
  const [netAmount, setNetAmount] = useState(String(receivable.pending_amount));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!accountId) {
      setError("Elige la cuenta que recibe el pago.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(receivable.invoice_id, {
        account_id: accountId,
        withholding_amount: Number(withholding) || 0,
        net_collected_amount: Number(netAmount) || 0,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar el cobro.");
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
            <h2 className="font-display text-lg font-bold text-navy">Registrar cobro</h2>
            <p className="text-xs text-steel">
              {receivable.code} · {receivable.billed_client_name} · Pendiente: {usd(receivable.pending_amount)}
              {receivable.iva_retention_amount + receivable.islr_retention_amount > 0 &&
                ` (ya retenido: ${usd(receivable.iva_retention_amount + receivable.islr_retention_amount)})`}
            </p>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="rounded-lg p-2 text-steel hover:bg-ash hover:text-navy">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Cuenta que recibe el pago</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
            >
              <option value="">Selecciona una cuenta...</option>
              {usdAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} (USD)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">Retenciones</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={withholding}
                onChange={(e) => setWithholding(e.target.value)}
                className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">Monto neto cobrado</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={netAmount}
                onChange={(e) => setNetAmount(e.target.value)}
                className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
              />
            </div>
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Registrar cobro
          </button>
        </div>
      </div>
    </div>
  );
}
