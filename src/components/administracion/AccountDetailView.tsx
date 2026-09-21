"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ChevronLeft, ExternalLink, Paperclip, Undo2, X } from "lucide-react";
import { getAccount, getAccountMovements } from "@/lib/api/administracion";
import type { Account, AccountMovement, CounterpartyType, ExpenseCategory, IncomeConcept } from "@/types/administracion";
import { formatEntryDate, formatEntryDateTime } from "@/lib/format";

/** source_type is only ever set on rows generated automatically from a real
 * document (a vehicle sale, a part sale, an invoice collection...) — a
 * manual entry never has one, so it's the right signal for "show the exact
 * closing time, not just the calendar date." */
function movementDateLabel(m: AccountMovement): string {
  return m.source_type ? formatEntryDateTime(m.created_at) : formatEntryDate(m.entry_date);
}

const TYPE_LABELS: Record<string, string> = { corriente: "Corriente", ahorro: "Ahorro", caja: "Caja" };

const CONCEPT_LABELS: Record<IncomeConcept, string> = {
  cobro_cliente: "Cobro de cliente",
  reembolso_holding: "Reembolso del holding",
  aporte_socio: "Aporte de socio",
  venta_activo: "Venta de activo",
  garantia_marca: "Garantía de marca",
  fi_intermediacion: "F&I (intermediación)",
  otro_ingreso: "Otro ingreso",
};

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  nomina_comisiones: "Nómina y Comisiones",
  servicios: "Servicios",
  compras_proveedores: "Compras a Proveedores",
  alquiler: "Alquiler",
  mantenimiento: "Mantenimiento",
  marketing: "Marketing",
  impuestos_tasas: "Impuestos y Tasas",
  garantia_rechazada: "Garantía Rechazada",
  otro: "Otro",
};

const COUNTERPARTY_LABELS: Record<CounterpartyType, string> = {
  cliente: "Cliente",
  proveedor: "Proveedor",
  tercero: "Tercero",
  socio: "Socio",
};

// Where a movement's own source document lives, when it has one — a
// vehicle/parts sale, an ODS invoice, a resolved supplier claim, a paid
// warranty submission. Manual entries (most egresos, several conceptos)
// have no such document; clicking those just expands the entry itself.
function sourceHref(m: AccountMovement): string | null {
  if (!m.source_type || !m.source_id) return null;
  switch (m.source_type) {
    case "vehicle_sale":
      return `/dashboard/concesionario/ventas?sale=${m.source_id}`;
    case "part_sale":
      return `/dashboard/repuestos/ventas/${m.source_id}`;
    case "service_order":
      return `/dashboard/servicios/${m.source_id}`;
    case "supplier_claim":
      return `/dashboard/administracion/reclamos?claim=${m.source_id}`;
    case "warranty_submission":
      return `/dashboard/administracion/presentaciones?submission=${m.source_id}`;
    default:
      return null;
  }
}

function movementLabel(m: AccountMovement): string {
  if (m.movement_type === "ingreso") return m.concept ? CONCEPT_LABELS[m.concept] : "Automático";
  return m.category ? CATEGORY_LABELS[m.category] : "—";
}

function counterpartyLabel(m: AccountMovement): string {
  if (!m.counterparty_type) return "—";
  if (m.counterparty_type === "cliente" || m.counterparty_type === "proveedor") {
    return m.counterparty_name ?? COUNTERPARTY_LABELS[m.counterparty_type];
  }
  return m.counterparty_name ?? COUNTERPARTY_LABELS[m.counterparty_type];
}

interface AccountDetailViewProps {
  accountId: string;
}

export default function AccountDetailView({ accountId }: AccountDetailViewProps) {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [movements, setMovements] = useState<AccountMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailMovement, setDetailMovement] = useState<AccountMovement | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([getAccount(accountId), getAccountMovements(accountId)])
      .then(([accountData, movementsData]) => {
        setAccount(accountData);
        setMovements(movementsData);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "No se pudo cargar la cuenta.");
      })
      .finally(() => setLoading(false));
  }, [accountId]);

  function handleRowClick(m: AccountMovement) {
    const href = sourceHref(m);
    if (href) router.push(href);
    else setDetailMovement(m);
  }

  if (loading) {
    return <div className="p-12 text-center text-sm text-steel">Cargando cuenta...</div>;
  }

  if (error || !account) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
        <h1 className="mt-4 font-display text-xl font-bold text-navy">No se pudo cargar la cuenta</h1>
        <p className="mt-2 text-sm text-steel">{error ?? "La cuenta no existe."}</p>
        <button
          onClick={() => router.push("/dashboard/administracion/finanzas/cuentas")}
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-steel hover:text-navy"
        >
          <ChevronLeft className="h-4 w-4" />
          Volver a Cuentas
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => router.push("/dashboard/administracion/finanzas/cuentas")}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-steel hover:text-navy"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver a Cuentas
      </button>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-navy">{account.name}</h1>
          <p className="mt-1 text-sm text-steel">
            {account.bank ?? "Sin banco"} · {TYPE_LABELS[account.account_type]} ·{" "}
            {account.currency === "usd" ? "USD" : "Bs"}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
            account.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
          }`}
        >
          {account.is_active ? "Activa" : "Inactiva"}
        </span>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-ash p-5">
          <p className="font-mono text-[11px] uppercase tracking-widest text-steel">Saldo actual</p>
          <p className="mt-1 font-display text-2xl font-bold text-navy">
            {account.currency === "usd" ? `$${account.balance.toLocaleString()}` : `Bs. ${account.balance.toLocaleString()}`}
          </p>
          {account.currency === "bs" && <p className="mt-1 text-xs text-steel">≈ ${account.balance_usd.toFixed(2)}</p>}
        </div>
        <div className="rounded-xl bg-ash p-5">
          <p className="font-mono text-[11px] uppercase tracking-widest text-steel">Saldo inicial</p>
          <p className="mt-1 font-display text-2xl font-bold text-navy">
            {account.currency === "usd" ? `$${account.opening_balance.toLocaleString()}` : `Bs. ${account.opening_balance.toLocaleString()}`}
          </p>
        </div>
        <div className="rounded-xl bg-ash p-5">
          <p className="font-mono text-[11px] uppercase tracking-widest text-steel">Movimientos recientes</p>
          <p className="mt-1 font-display text-2xl font-bold text-navy">{movements.length}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-navy/10 bg-white">
        <p className="border-b border-navy/10 px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">
          Últimos movimientos
        </p>
        {movements.length === 0 ? (
          <div className="p-12 text-center text-sm text-steel">Esta cuenta todavía no tiene movimientos.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-navy/10 bg-ash">
              <tr>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Fecha</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Tipo</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Concepto</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Descripción</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Contraparte</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Monto</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {movements.map((m) => {
                const hasSource = sourceHref(m) !== null;
                return (
                  <tr key={m.id} onClick={() => handleRowClick(m)} className="cursor-pointer transition hover:bg-ash/60">
                    <td className="px-6 py-4 text-steel">{movementDateLabel(m)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          m.movement_type === "ingreso" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                        }`}
                      >
                        {m.movement_type === "ingreso" ? "Ingreso" : "Egreso"}
                      </span>
                      {m.reverses_entry_id && (
                        <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                          <Undo2 className="h-3 w-3" /> Reverso
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-navy">{movementLabel(m)}</td>
                    <td className="px-6 py-4 text-steel">
                      {m.description}
                      {m.attachment_url && <Paperclip className="ml-1.5 inline h-3 w-3 text-blue" />}
                    </td>
                    <td className="px-6 py-4 text-steel">{counterpartyLabel(m)}</td>
                    <td className={`px-6 py-4 font-semibold ${m.movement_type === "ingreso" ? "text-emerald-700" : "text-red-600"}`}>
                      {m.movement_type === "ingreso" ? "+" : "-"}
                      {m.currency === "usd" ? "$" : "Bs. "}
                      {Math.abs(m.amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {hasSource && <ExternalLink className="ml-auto h-4 w-4 text-steel" />}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {detailMovement && <MovementDetailModal movement={detailMovement} onClose={() => setDetailMovement(null)} />}
    </div>
  );
}

function MovementDetailModal({ movement, onClose }: { movement: AccountMovement; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-navy/40" />
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-navy/10 px-6 py-4">
          <h2 className="font-display text-lg font-bold text-navy">Detalle del movimiento</h2>
          <button onClick={onClose} aria-label="Cerrar" className="rounded-lg p-2 text-steel hover:bg-ash hover:text-navy">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-3 p-6 text-sm">
          <Row label="Fecha" value={movementDateLabel(movement)} />
          <Row label={movement.movement_type === "ingreso" ? "Concepto" : "Categoría"} value={movementLabel(movement)} />
          <Row label="Descripción" value={movement.description} />
          <Row label="Contraparte" value={counterpartyLabel(movement)} />
          <Row
            label="Monto"
            value={`${movement.currency === "usd" ? "$" : "Bs. "}${Math.abs(movement.amount).toLocaleString()}`}
          />
          {movement.reference && <Row label="Referencia" value={movement.reference} />}
          {movement.attachment_url && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-steel">Soporte</span>
              <a
                href={movement.attachment_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-medium text-blue hover:underline"
              >
                <Paperclip className="h-3.5 w-3.5" /> Ver adjunto
              </a>
            </div>
          )}
          <p className="rounded-xl bg-ash px-4 py-3 text-xs text-steel">
            Este movimiento se registró manualmente en Finanzas y no tiene un documento de origen que abrir.
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-steel">{label}</span>
      <span className="font-medium text-navy">{value}</span>
    </div>
  );
}
