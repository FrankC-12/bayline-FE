"use client";

import { useMemo, useState } from "react";
import { Plus, Search, X, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useIncomeEntries } from "@/hooks/useIncomeEntries";
import { useAccounts } from "@/hooks/useAccounts";

export default function IncomeView() {
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;
  const [search, setSearch] = useState("");
  const { entries, loading, addEntry } = useIncomeEntries(filialId, search || undefined);
  const { accounts } = useAccounts(filialId);
  const [createOpen, setCreateOpen] = useState(false);

  const accountName = (id: string) => accounts.find((a) => a.id === id)?.name ?? "—";

  const total = useMemo(() => {
    return entries.reduce((sum, e) => {
      const account = accounts.find((a) => a.id === e.account_id);
      if (!account) return sum;
      return sum + (account.currency === "usd" ? e.amount : 0);
    }, 0);
  }, [entries, accounts]);

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold text-navy">Ingresos</h1>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy"
        >
          <Plus className="h-4 w-4" />
          Registrar Ingreso Manual
        </button>
      </div>
      <p className="mb-4 text-sm text-steel">Registro de ingresos automáticos y manuales</p>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por documento, descripción, origen, cuenta..."
            className="w-full rounded-full border border-navy/15 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
          />
        </div>
        <span className="whitespace-nowrap rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700">
          Total: ${total.toFixed(2)}
        </span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-navy/10 bg-white">
        {loading ? (
          <div className="p-12 text-center text-sm text-steel">Cargando ingresos...</div>
        ) : entries.length === 0 ? (
          <div className="p-12 text-center text-sm text-steel">No hay ingresos registrados.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-navy/10 bg-ash">
              <tr>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Fecha</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Origen</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Documento</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Descripción</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Monto</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Cuenta destino</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {entries.map((e) => (
                <tr key={e.id} className="transition hover:bg-ash/60">
                  <td className="px-6 py-4 text-steel">{new Date(e.entry_date).toLocaleDateString("es-VE")}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${e.source === "automatico" ? "bg-blue-light text-blue" : "bg-amber-100 text-amber-700"}`}
                    >
                      {e.source === "automatico" ? "Automático" : "Manual"}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-blue">{e.origin_reference ?? "—"}</td>
                  <td className="px-6 py-4 text-navy">{e.description}</td>
                  <td className="px-6 py-4 font-semibold text-navy">
                    {e.currency === "usd" ? `$${e.amount.toLocaleString()}` : `Bs. ${e.amount.toLocaleString()}`}
                  </td>
                  <td className="px-6 py-4 text-steel">{accountName(e.account_id)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {filialId && <CreateIncomeModal open={createOpen} onClose={() => setCreateOpen(false)} onSubmit={addEntry} />}
    </div>
  );
}

function CreateIncomeModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: { entry_date: string; description: string; amount: number; currency: string; account_id: string }) => Promise<unknown>;
}) {
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;
  const { accounts } = useAccounts(filialId);

  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [currency, setCurrency] = useState("bs");
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!entryDate || !amount || !accountId || !description.trim()) {
      setError("Completa fecha, monto, cuenta y descripción.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ entry_date: entryDate, description, amount: Number(amount), currency, account_id: accountId });
      setAmount("");
      setDescription("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar el ingreso.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-navy/40" />
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-navy/10 px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-bold text-navy">Registrar Ingreso Manual</h2>
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
            </div>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">Cuenta destino *</label>
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
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Descripción *</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Abono de cliente por servicio pendiente"
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
            Registrar ingreso
          </button>
        </div>
      </div>
    </div>
  );
}