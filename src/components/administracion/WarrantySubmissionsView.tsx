"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, X, Loader2, ChevronDown, ChevronUp, Download, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWarrantySubmissions } from "@/hooks/useWarrantySubmissions";
import { useAccounts } from "@/hooks/useAccounts";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useParts } from "@/hooks/useParts";
import { downloadWarrantySubmissionCsv } from "@/lib/api/administracion";
import type { WarrantySubmission, WarrantySubmissionStatus } from "@/types/administracion";
import EmptyState from "@/components/common/EmptyState";

const MONTH_LABELS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const STATUS_LABELS: Record<WarrantySubmissionStatus, string> = {
  borrador: "Borrador",
  presentada: "Presentada",
  pagada: "Pagada",
};

const STATUS_STYLES: Record<WarrantySubmissionStatus, string> = {
  borrador: "bg-slate-100 text-slate-600",
  presentada: "bg-blue-light text-blue",
  pagada: "bg-emerald-100 text-emerald-700",
};

function formatAmount(amount: number, currency: string): string {
  return `${currency.toUpperCase()} ${amount.toLocaleString("es-VE", { minimumFractionDigits: 2 })}`;
}

export default function WarrantySubmissionsView() {
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;

  const { submissions, loading, addSubmission, refreshOne, submitOne, payOne, removeOne } =
    useWarrantySubmissions(filialId);

  const searchParams = useSearchParams();
  const deepLinkSubmissionId = searchParams.get("submission");

  const [createOpen, setCreateOpen] = useState(false);
  const [payingSubmission, setPayingSubmission] = useState<WarrantySubmission | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!deepLinkSubmissionId || submissions.length === 0) return;
    if (submissions.some((s) => s.id === deepLinkSubmissionId)) {
      setExpandedId(deepLinkSubmissionId);
      document.getElementById(`submission-${deepLinkSubmissionId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [deepLinkSubmissionId, submissions]);

  async function handleRefresh(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await refreshOne(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar la presentación.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleSubmit(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await submitOne(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo presentar la lista.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este borrador? Las facturas que contiene quedarán libres para una futura presentación.")) return;
    setBusyId(id);
    setError(null);
    try {
      await removeOne(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar la presentación.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleExport(submission: WarrantySubmission) {
    setError(null);
    try {
      await downloadWarrantySubmissionCsv(submission.id, submission.code);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo exportar la presentación.");
    }
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold text-navy">Presentación de Garantías al Holding</h1>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy"
        >
          <Plus className="h-4 w-4" />
          Nueva presentación
        </button>
      </div>
      <p className="mb-4 text-sm text-steel">
        Junta las facturas de garantía absorbidas por el taller cada mes y arma la lista que se le presenta al holding para que pague.
      </p>

      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
        {loading ? (
          <div className="p-12 text-center text-sm text-steel">Cargando presentaciones...</div>
        ) : submissions.length === 0 ? (
          <EmptyState compact title="No hay presentaciones registradas." />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-navy/10 bg-ash">
              <tr>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Código</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Período</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Facturas</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Monto total</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Estado</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel" />
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {submissions.map((s) => (
                <SubmissionRow
                  key={s.id}
                  submission={s}
                  expanded={expandedId === s.id}
                  busy={busyId === s.id}
                  onToggle={() => setExpandedId(expandedId === s.id ? null : s.id)}
                  onRefresh={() => handleRefresh(s.id)}
                  onSubmit={() => handleSubmit(s.id)}
                  onDelete={() => handleDelete(s.id)}
                  onExport={() => handleExport(s)}
                  onPay={() => setPayingSubmission(s)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {filialId && (
        <CreateSubmissionModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onSubmit={addSubmission}
        />
      )}
      {payingSubmission && (
        <PayModal
          submission={payingSubmission}
          onClose={() => setPayingSubmission(null)}
          onSubmit={payOne}
        />
      )}
    </div>
  );
}

function SubmissionRow({
  submission,
  expanded,
  busy,
  onToggle,
  onRefresh,
  onSubmit,
  onDelete,
  onExport,
  onPay,
}: {
  submission: WarrantySubmission;
  expanded: boolean;
  busy: boolean;
  onToggle: () => void;
  onRefresh: () => void;
  onSubmit: () => void;
  onDelete: () => void;
  onExport: () => void;
  onPay: () => void;
}) {
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;
  const { suppliers } = useSuppliers(filialId);
  const { parts } = useParts(filialId);

  const partName = (id: string) => parts.find((p) => p.id === id)?.name ?? "—";
  const supplierName = (id: string) => suppliers.find((s) => s.id === id)?.business_name ?? "—";

  return (
    <>
      <tr id={`submission-${submission.id}`} className="transition hover:bg-ash/60">
        <td className="px-6 py-4">
          <button onClick={onToggle} className="flex items-center gap-1.5 font-mono font-semibold text-blue">
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {submission.code}
          </button>
        </td>
        <td className="px-6 py-4 text-navy">
          {MONTH_LABELS[submission.period_month - 1]} {submission.period_year}
        </td>
        <td className="px-6 py-4 text-steel">{submission.claims.length}</td>
        <td className="px-6 py-4 font-semibold text-navy">
          {formatAmount(submission.total_claimed_amount, submission.currency)}
        </td>
        <td className="px-6 py-4">
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[submission.status]}`}>
            {STATUS_LABELS[submission.status]}
          </span>
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center justify-end gap-2">
            {busy && <Loader2 className="h-4 w-4 animate-spin text-steel" />}
            {submission.status === "borrador" && (
              <>
                <button
                  onClick={onRefresh}
                  disabled={busy}
                  className="rounded-full border border-navy/15 px-3 py-1.5 text-xs font-semibold text-navy transition hover:border-blue hover:text-blue disabled:opacity-50"
                >
                  Actualizar
                </button>
                <button
                  onClick={onSubmit}
                  disabled={busy || submission.claims.length === 0}
                  className="rounded-full bg-blue px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-navy disabled:opacity-50"
                >
                  Presentar
                </button>
                <button
                  onClick={onDelete}
                  disabled={busy}
                  className="rounded-full border border-navy/15 p-1.5 text-steel transition hover:border-red-300 hover:text-red-600 disabled:opacity-50"
                  title="Eliminar borrador"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </>
            )}
            {submission.status === "presentada" && (
              <>
                <button
                  onClick={onExport}
                  className="inline-flex items-center gap-1.5 rounded-full border border-navy/15 px-3 py-1.5 text-xs font-semibold text-navy transition hover:border-blue hover:text-blue"
                >
                  <Download className="h-3.5 w-3.5" />
                  Exportar
                </button>
                <button
                  onClick={onPay}
                  className="rounded-full bg-blue px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-navy"
                >
                  Marcar como pagada
                </button>
              </>
            )}
            {submission.status === "pagada" && (
              <button
                onClick={onExport}
                className="inline-flex items-center gap-1.5 rounded-full border border-navy/15 px-3 py-1.5 text-xs font-semibold text-navy transition hover:border-blue hover:text-blue"
              >
                <Download className="h-3.5 w-3.5" />
                Exportar
              </button>
            )}
          </div>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={6} className="bg-ash/40 px-6 py-4">
            {submission.status === "pagada" && (
              <div className="mb-3 flex flex-wrap gap-6 rounded-xl bg-white px-4 py-3 text-sm">
                <span className="text-steel">
                  Retenciones: <span className="font-semibold text-navy">{formatAmount(submission.withholding_amount ?? 0, submission.currency)}</span>
                </span>
                <span className="text-steel">
                  Neto cobrado: <span className="font-semibold text-navy">{formatAmount(submission.net_amount_received ?? 0, submission.currency)}</span>
                </span>
                {submission.paid_at && (
                  <span className="text-steel">
                    Pagado el <span className="font-semibold text-navy">{new Date(submission.paid_at).toLocaleDateString("es-VE")}</span>
                  </span>
                )}
              </div>
            )}
            {submission.claims.length === 0 ? (
              <p className="text-sm italic text-steel">Sin facturas en este período todavía.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-steel">
                    <th className="pb-2 font-mono text-[10px] uppercase tracking-widest">Repuesto</th>
                    <th className="pb-2 font-mono text-[10px] uppercase tracking-widest">Proveedor</th>
                    <th className="pb-2 font-mono text-[10px] uppercase tracking-widest">Cant.</th>
                    <th className="pb-2 font-mono text-[10px] uppercase tracking-widest">Monto</th>
                    <th className="pb-2 font-mono text-[10px] uppercase tracking-widest">Resuelto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy/5">
                  {submission.claims.map((c) => (
                    <tr key={c.id}>
                      <td className="py-2 font-medium text-navy">{partName(c.part_id)}</td>
                      <td className="py-2 text-steel">{supplierName(c.supplier_id)}</td>
                      <td className="py-2 text-steel">{c.quantity}</td>
                      <td className="py-2 text-navy">
                        {c.claimed_amount != null && c.currency ? formatAmount(c.claimed_amount, c.currency) : "—"}
                      </td>
                      <td className="py-2 text-steel">
                        {c.resolved_at ? new Date(c.resolved_at).toLocaleDateString("es-VE") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

function CreateSubmissionModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: { period_year: number; period_month: number; currency: string }) => Promise<unknown>;
}) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [currency, setCurrency] = useState("usd");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ period_year: year, period_month: month, currency });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la presentación.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-navy/40" />
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-navy/10 px-6 py-4">
          <h2 className="font-display text-lg font-bold text-navy">Nueva presentación</h2>
          <button onClick={onClose} aria-label="Cerrar" className="rounded-lg p-2 text-steel hover:bg-ash hover:text-navy">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <p className="text-sm text-steel">
            Se juntarán automáticamente todas las facturas de garantía absorbidas por el taller en el período elegido.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">Mes</label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
              >
                {MONTH_LABELS.map((label, i) => (
                  <option key={label} value={i + 1}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">Año</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Moneda</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
            >
              <option value="usd">USD</option>
              <option value="bs">Bs</option>
            </select>
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Crear presentación
          </button>
        </div>
      </div>
    </div>
  );
}

function PayModal({
  submission,
  onClose,
  onSubmit,
}: {
  submission: WarrantySubmission;
  onClose: () => void;
  onSubmit: (id: string, input: { account_id: string; withholding_amount: number; net_amount_received: number }) => Promise<unknown>;
}) {
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;
  const { accounts } = useAccounts(filialId);
  const matchingAccounts = accounts.filter((a) => a.currency === submission.currency);

  const [accountId, setAccountId] = useState("");
  const [withholding, setWithholding] = useState("0");
  const [netAmount, setNetAmount] = useState(String(submission.total_claimed_amount));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!accountId) {
      setError("Elige la cuenta donde entró el pago.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(submission.id, {
        account_id: accountId,
        withholding_amount: Number(withholding) || 0,
        net_amount_received: Number(netAmount) || 0,
      });
      onClose();
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
            <h2 className="font-display text-lg font-bold text-navy">Registrar pago del holding</h2>
            <p className="text-xs text-steel">
              {submission.code} · Reclamado: {formatAmount(submission.total_claimed_amount, submission.currency)}
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
              {matchingAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.currency.toUpperCase()})
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
            Registrar pago
          </button>
        </div>
      </div>
    </div>
  );
}
