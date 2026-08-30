"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAccounts } from "@/hooks/useAccounts";
import { getFinanceDashboard } from "@/lib/api/administracion";
import type { FinanceDashboard } from "@/types/administracion";

export default function FinanceDashboardView() {
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;
  const { accounts } = useAccounts(filialId);
  const [dashboard, setDashboard] = useState<FinanceDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!filialId) return;
    setLoading(true);
    getFinanceDashboard(filialId).then((data) => {
      setDashboard(data);
      setLoading(false);
    });
  }, [filialId]);

  if (loading || !dashboard) {
    return <div className="p-12 text-center text-sm text-steel">Cargando dashboard...</div>;
  }

  const maxValue = Math.max(1, ...dashboard.trend.flatMap((t) => [t.income, t.expense]));
  const usdAccounts = accounts.filter((a) => a.currency === "usd");
  const bsAccounts = accounts.filter((a) => a.currency === "bs");
  const totalUsd = usdAccounts.reduce((sum, a) => sum + a.balance, 0);
  const totalBsUsd = bsAccounts.reduce((sum, a) => sum + a.balance_usd, 0);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-navy">Dashboard</h1>
      <p className="mt-1 text-sm text-steel">
        Situación financiera del negocio · Tasa BCV Bs. {dashboard.bcv_rate.toFixed(2)}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-navy/10 bg-white p-6">
          <p className="font-mono text-[11px] uppercase tracking-widest text-steel">Ingresos del mes</p>
          <p className="mt-1 font-display text-3xl font-bold text-navy">${dashboard.income_month.toFixed(2)}</p>
        </div>
        <div className="rounded-2xl border border-navy/10 bg-white p-6">
          <p className="font-mono text-[11px] uppercase tracking-widest text-steel">Egresos del mes</p>
          <p className="mt-1 font-display text-3xl font-bold text-red-500">${dashboard.expense_month.toFixed(2)}</p>
        </div>
        <div
          className={`rounded-2xl border p-6 ${dashboard.net_flow >= 0 ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}
        >
          <p className="font-mono text-[11px] uppercase tracking-widest text-steel">Flujo de caja neto</p>
          <p className={`mt-1 font-display text-3xl font-bold ${dashboard.net_flow >= 0 ? "text-emerald-700" : "text-red-600"}`}>
            {dashboard.net_flow >= 0 ? "+" : ""}${dashboard.net_flow.toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-steel">{dashboard.net_flow >= 0 ? "El mes cierra con superávit" : "El mes cierra en déficit"}</p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-navy/10 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="font-display font-bold text-navy">Tendencia · últimos 6 meses</p>
            <p className="text-xs text-steel">Montos consolidados en USD</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-600" /> Ingresos</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-red-500" /> Egresos</span>
          </div>
        </div>
        <div className="flex h-48 items-end justify-between gap-4">
          {dashboard.trend.map((t) => (
            <div key={t.label} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex h-40 items-end gap-1">
                <div
                  className="w-5 rounded-t bg-emerald-600"
                  style={{ height: `${Math.max(4, (t.income / maxValue) * 100)}%` }}
                  title={`Ingresos: $${t.income.toFixed(2)}`}
                />
                <div
                  className="w-5 rounded-t bg-red-500"
                  style={{ height: `${Math.max(4, (t.expense / maxValue) * 100)}%` }}
                  title={`Egresos: $${t.expense.toFixed(2)}`}
                />
              </div>
              <p className="text-xs font-semibold text-navy">{t.label}</p>
              <p className={`text-[10px] ${t.income - t.expense >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                {t.income - t.expense >= 0 ? "+" : ""}${(t.income - t.expense).toFixed(0)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-steel">
          Cuentas en USD ${totalUsd.toLocaleString()} · Cuentas en Bs ≈ ${totalBsUsd.toFixed(2)}
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((a) => (
            <div key={a.id} className="rounded-2xl border border-navy/10 bg-white p-5">
              <div className="flex items-center justify-between">
                <p className="font-display font-bold text-navy">{a.name}</p>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${a.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                  {a.is_active ? "Activa" : "Inactiva"}
                </span>
              </div>
              <p className="mt-2 font-display text-xl font-bold text-navy">
                {a.currency === "usd" ? `$${a.balance.toLocaleString()}` : `Bs. ${a.balance.toLocaleString()}`}
              </p>
              <p className="text-xs text-steel">{a.bank ?? "Caja"}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}