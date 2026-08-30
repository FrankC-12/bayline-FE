"use client";

import { useMemo, useState } from "react";
import { Plus, Search, X, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useExpenseEntries } from "@/hooks/useExpenseEntries";
import { useAccounts } from "@/hooks/useAccounts";
import type { ExpenseCategory } from "@/types/administracion";

const CATEGORY_OPTIONS: { value: ExpenseCategory; label: string }[] = [
  { value: "nomina_comisiones", label: "Nómina y Comisiones" },
  { value: "servicios", label: "Servicios" },
  { value: "compras_proveedores", label: "Compras a Proveedores" },
  { value: "alquiler", label: "Alquiler" },
  { value: "mantenimiento", label: "Mantenimiento" },
  { value: "marketing", label: "Marketing" },
  { value: "impuestos_tasas", label: "Impuestos y Tasas" },
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
  otro: "bg-gray-100 text-gray-600",
};

function categoryLabel(c: ExpenseCategory) {
  return CATEGORY_OPTIONS.find((o) => o.value === c)?.label ?? c;
}

export default function ExpenseView() {
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;
  const [search, setSearch] = useState("");
  const { entries, loading, addEntry } = useExpenseEntries(filialId, search || undefined);
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
        <h1 className="font-display text-3xl font-bold text-navy">Egresos</h1>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy"
        >
          <Plus className="h-4 w-4" />
          Registrar Egreso
        </button>
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
        ) : entries.length === 0 ? (
          <div className="p-12 text-center text-sm text-steel">No hay egresos registrados.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-navy/10 bg-ash">
              <tr>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Fecha</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Categoría</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Beneficiario</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Descripción</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Monto</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Cuenta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {entries.map((e) => (
                <tr key={e.id} className="transition hover:bg-ash/60">
                  <td className="px-6 py-4 text-steel">{new Date(e.entry_date).toLocaleDateString("es-VE")}</td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${CATEGORY_STYLES[e.category]}`}>
                      {categoryLabel(e.category)}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-navy">{e.beneficiary}</td>
                  <td className="px-6 py-4 text-steel">{e.description}</td>
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

      {filialId && <CreateExpenseModal open={createOpen} onClose={() => setCreateOpen(false)} onSubmit={addEntry} />}
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
  onSubmit: (input: {
    entry_date: string;
    category: string;
    beneficiary: string;
    description: string;
    amount: number;
    currency: string;
    account_id: string;
  }) => Promise<unknown>;
}) {
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;
  const { accounts } = useAccounts(filialId);

  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState<ExpenseCategory>("servicios");
  const [beneficiary, setBeneficiary] = useState("");
  const [currency, setCurrency] = useState("bs");
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!entryDate || !beneficiary.trim() || !amount || !accountId || !description.trim()) {
      setError("Completa todos los campos obligatorios.");
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
      });
      setBeneficiary("");
      setAmount("");
      setDescription("");
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
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">Categoría *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
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
            <label className="mb-1.5 block text-sm font-medium text-navy">Descripción *</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Quincena agosto · personal de taller"
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
            Registrar egreso
          </button>
        </div>
      </div>
    </div>
  );
}