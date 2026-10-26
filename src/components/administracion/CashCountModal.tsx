"use client";
import { useEffect, useRef, useState } from "react";
import Modal from "@/components/common/Modal";
import { NumberInput } from "@/components/ui/NumberInput";
import { apiFetch } from "@/lib/api/client";
import { localToday } from "@/lib/holdingControlFormat";
import { formatMoney } from "@/lib/format";
import type { Account } from "@/types/administracion";

export default function CashCountModal({
  open,
  onClose,
  filialId,
  accounts,
}: {
  open: boolean;
  onClose: () => void;
  filialId: string;
  accounts: Account[];
}) {
  const [accountId, setAccountId] = useState("");
  const [counted, setCounted] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    expected: string;
    difference: string;
    currency: string;
  } | null>(null);
  const requestId = useRef("");
  const pending = useRef(false);
  useEffect(() => {
    if (open) {
      requestId.current = crypto.randomUUID();
      setAccountId("");
      setCounted("");
      setNote("");
      setError("");
      setResult(null);
    }
  }, [open, filialId]);
  const cash = accounts.filter(
    (account) => account.is_active && account.account_type === "caja",
  );
  async function save() {
    if (pending.current) return;
    if (
      !accountId ||
      counted === "" ||
      !Number.isFinite(Number(counted)) ||
      Number(counted) < 0
    ) {
      setError("Selecciona la caja e indica el efectivo contado.");
      return;
    }
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      const response = await apiFetch<{
        evidence: { expected: string; difference: string; currency: string };
      }>("/cash-counts", {
        method: "POST",
        body: JSON.stringify({
          request_id: requestId.current,
          entry_date: localToday(),
          record: {
            kind: "cash_count",
            filial_id: filialId,
            account_id: accountId,
            counted,
            note,
          },
        }),
      });
      setResult(response.evidence);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo registrar el arqueo.",
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return (
    <Modal
      open={open}
      onClose={onClose}
      closeDisabled={busy}
      title="Arqueo de caja"
      size="md"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-full border px-5 py-2.5 text-sm"
          >
            {result ? "Cerrar" : "Cancelar"}
          </button>
          {!result && (
            <button
              type="button"
              onClick={() => void save()}
              disabled={busy || !cash.length}
              className="rounded-full bg-blue px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy ? "Guardando…" : "Registrar arqueo"}
            </button>
          )}
        </>
      }
    >
      <div className="space-y-4 p-6">
        <p className="text-sm text-steel">
          Registra el efectivo contado en su moneda original. La diferencia
          queda como evidencia y no modifica el saldo de la cuenta.
        </p>
        {result ? (
          <div role="status" className="rounded-xl bg-emerald-50 p-4 text-sm">
            <p>Arqueo registrado.</p>
            <p>
              Saldo esperado: {result.currency.toUpperCase()}{" "}
              {formatMoney(Number(result.expected))}
            </p>
            <p>Diferencia: {formatMoney(Number(result.difference))}</p>
          </div>
        ) : (
          <>
            <label className="block text-sm font-medium">
              Caja
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                disabled={busy}
                className="mt-1 block w-full rounded-xl border p-3"
              >
                <option value="">Selecciona una caja</option>
                {cash.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} · {account.currency.toUpperCase()}
                  </option>
                ))}
              </select>
            </label>
            {!cash.length && (
              <p className="text-sm text-amber-800">
                Crea una cuenta de tipo Caja antes de registrar el arqueo.
              </p>
            )}
            <label className="block text-sm font-medium">
              Efectivo contado
              <NumberInput
                value={counted}
                onValueChange={setCounted}
                inputMode="decimal"
                min={0}
                disabled={busy}
                className="mt-1 w-full rounded-xl border p-3"
              />
            </label>
            <label className="block text-sm font-medium">
              Observación (opcional)
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={busy}
                maxLength={500}
                className="mt-1 w-full rounded-xl border p-3"
              />
            </label>
          </>
        )}
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
