"use client";

import { useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";
import type { Account } from "@/types/administracion";
import type { CreateTransferInput } from "@/lib/api/administracion";

interface TransferModalProps {
  fromAccount: Account;
  accounts: Account[];
  bcvRate: number | null;
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: (input: Omit<CreateTransferInput, "filial_id">) => void;
}

export default function TransferModal({
  fromAccount,
  accounts,
  bcvRate,
  submitting,
  error,
  onClose,
  onConfirm,
}: TransferModalProps) {
  const otherAccounts = useMemo(
    () => accounts.filter((a) => a.id !== fromAccount.id && a.is_active),
    [accounts, fromAccount.id]
  );
  const [toAccountId, setToAccountId] = useState(otherAccounts[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [exchangeRate, setExchangeRate] = useState(bcvRate ? String(bcvRate) : "");
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const toAccount = otherAccounts.find((a) => a.id === toAccountId) ?? null;
  const needsRate = !!toAccount && toAccount.currency !== fromAccount.currency;

  function handleSubmit() {
    if (!toAccountId) {
      setFormError("Selecciona la cuenta destino.");
      return;
    }
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setFormError("Ingresa un monto mayor a 0.");
      return;
    }
    if (needsRate && (!exchangeRate || Number(exchangeRate) <= 0)) {
      setFormError("Las cuentas tienen monedas distintas — ingresa la tasa aplicada.");
      return;
    }
    setFormError(null);
    onConfirm({
      entry_date: entryDate,
      from_account_id: fromAccount.id,
      to_account_id: toAccountId,
      amount: numericAmount,
      exchange_rate: needsRate ? Number(exchangeRate) : null,
      description: description.trim() || null,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-navy/40" />
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-navy/10 px-6 py-4">
          <h2 className="font-display text-lg font-bold text-navy">Transferir entre cuentas</h2>
          <button onClick={onClose} aria-label="Cerrar" className="rounded-lg p-2 text-steel hover:bg-ash hover:text-navy">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Desde</label>
            <p className="rounded-xl border border-navy/10 bg-ash px-4 py-2.5 text-sm text-navy">
              {fromAccount.name} · {fromAccount.currency === "usd" ? "USD" : "Bs"}
            </p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Hacia *</label>
            <select
              value={toAccountId}
              onChange={(e) => setToAccountId(e.target.value)}
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
            >
              <option value="">Selecciona una cuenta...</option>
              {otherAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} · {a.currency === "usd" ? "USD" : "Bs"}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">
                Monto ({fromAccount.currency === "usd" ? "USD" : "Bs"}) *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
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
          {needsRate && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">Tasa aplicada (Bs/USD) *</label>
              <input
                type="number"
                min="0"
                step="0.00000001"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
                placeholder="Ej. 40.00000000"
                className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
              />
              {amount && exchangeRate && Number(exchangeRate) > 0 && (
                <p className="mt-1 text-xs text-steel">
                  {fromAccount.currency === "usd"
                    ? `≈ Bs. ${(Number(amount) * Number(exchangeRate)).toLocaleString()}`
                    : `≈ $${(Number(amount) / Number(exchangeRate)).toFixed(2)}`}
                </p>
              )}
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Descripción (opcional)</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej. Depósito de caja a banco"
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
            />
          </div>
          {(formError || error) && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{formError ?? error}</p>
          )}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Confirmar transferencia
          </button>
        </div>
      </div>
    </div>
  );
}
