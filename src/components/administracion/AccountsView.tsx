"use client";

import { useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAccounts } from "@/hooks/useAccounts";

const TYPE_LABELS: Record<string, string> = { corriente: "Corriente", ahorro: "Ahorro", caja: "Caja" };

export default function AccountsView() {
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;
  const { accounts, loading, addAccount, editAccount } = useAccounts(filialId);
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold text-navy">Cuentas</h1>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy"
        >
          <Plus className="h-4 w-4" />
          Nueva Cuenta
        </button>
      </div>
      <p className="mb-6 text-sm text-steel">Cuentas bancarias y de efectivo del negocio</p>

      <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
        {loading ? (
          <div className="p-12 text-center text-sm text-steel">Cargando cuentas...</div>
        ) : accounts.length === 0 ? (
          <div className="p-12 text-center text-sm text-steel">No hay cuentas registradas.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-navy/10 bg-ash">
              <tr>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Nombre de cuenta</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Banco</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Moneda</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Tipo</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Saldo actual</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {accounts.map((a) => (
                <tr key={a.id} className="transition hover:bg-ash/60">
                  <td className="px-6 py-4 font-semibold text-navy underline">{a.name}</td>
                  <td className="px-6 py-4 text-steel">{a.bank ?? "—"}</td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-blue-light px-2 py-0.5 text-xs font-semibold text-blue">
                      {a.currency === "usd" ? "USD" : "Bs"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-navy">{TYPE_LABELS[a.account_type]}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-navy">
                        {a.currency === "usd" ? `$${a.balance.toLocaleString()}` : `Bs. ${a.balance.toLocaleString()}`}
                      </span>
                      <span className="rounded bg-ash px-1.5 py-0.5 font-mono text-[9px] font-semibold text-steel">AUTO</span>
                    </div>
                    {a.currency === "bs" && <p className="text-xs text-steel">≈ ${a.balance_usd.toFixed(2)}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => editAccount(a.id, { is_active: !a.is_active })}
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${a.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                    >
                      {a.is_active ? "Activa" : "Inactiva"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {filialId && <CreateAccountModal open={createOpen} onClose={() => setCreateOpen(false)} onSubmit={addAccount} />}
    </div>
  );
}

function CreateAccountModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: { name: string; bank?: string | null; currency: string; account_type: string }) => Promise<unknown>;
}) {
  const [name, setName] = useState("");
  const [bank, setBank] = useState("");
  const [currency, setCurrency] = useState("bs");
  const [accountType, setAccountType] = useState("corriente");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!name.trim()) {
      setError("El nombre de la cuenta es obligatorio.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ name, bank: bank || null, currency, account_type: accountType });
      setName("");
      setBank("");
      setCurrency("bs");
      setAccountType("corriente");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la cuenta.");
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
          <div>
            <h2 className="font-display text-lg font-bold text-navy">Nueva Cuenta</h2>
            <p className="text-xs text-steel">Los campos marcados con * son obligatorios</p>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="rounded-lg p-2 text-steel hover:bg-ash hover:text-navy">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Nombre de la cuenta *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Cuenta Corriente BNC"
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Banco</label>
            <input
              value={bank}
              onChange={(e) => setBank(e.target.value)}
              placeholder="BNC, Banesco, Mercantil..."
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
              <label className="mb-1.5 block text-sm font-medium text-navy">Tipo *</label>
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value)}
                className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
              >
                <option value="corriente">Corriente</option>
                <option value="ahorro">Ahorro</option>
                <option value="caja">Caja</option>
              </select>
            </div>
          </div>

          <p className="rounded-xl bg-ash px-4 py-3 text-xs text-steel">
            El saldo actual se calcula automáticamente con los ingresos y egresos asociados a la cuenta.
          </p>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Crear cuenta
          </button>
        </div>
      </div>
    </div>
  );
}