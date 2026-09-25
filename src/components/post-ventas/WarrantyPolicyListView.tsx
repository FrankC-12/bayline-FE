"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWarrantyPolicies } from "@/hooks/useWarrantyPolicies";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import type { WarrantyPolicyAppliesTo, WarrantyPolicyCoveredBy, WarrantyPolicyStatus } from "@/types/warrantyPolicy";

const APPLIES_TO_LABELS: Record<WarrantyPolicyAppliesTo, string> = {
  mano_de_obra: "Mano de obra",
  repuestos: "Repuestos",
  ambas: "Ambas",
};

const COVERED_BY_LABELS: Record<WarrantyPolicyCoveredBy, string> = {
  la_casa: "La casa",
  fabrica_importador: "Fábrica / Importador",
  proveedor: "Proveedor",
};

export default function WarrantyPolicyListView() {
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<WarrantyPolicyStatus | "">("");
  const [appliesTo, setAppliesTo] = useState<WarrantyPolicyAppliesTo | "">("");
  const [coveredBy, setCoveredBy] = useState<WarrantyPolicyCoveredBy | "">("");

  const { policies, loading, error, refresh } = useWarrantyPolicies(filialId, {
    search: search || undefined,
    status: status || undefined,
    appliesTo: appliesTo || undefined,
    coveredBy: coveredBy || undefined,
  });

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold text-navy">Políticas de Garantía</h1>
        <Link
          href="/dashboard/post-ventas/politicas-garantia/nueva"
          className="inline-flex items-center gap-2 rounded-full bg-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy"
        >
          <Plus className="h-4 w-4" />
          Nueva política
        </Link>
      </div>
      <p className="mb-4 text-sm text-steel">
        Catálogo de garantías seleccionables al facturar una ODS — mano de obra y repuestos por separado.
      </p>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre..."
            className="w-full rounded-full border border-navy/15 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as WarrantyPolicyStatus | "")}
          className="rounded-full border border-navy/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue"
        >
          <option value="">Todos los estados</option>
          <option value="activa">Activa</option>
          <option value="inactiva">Inactiva</option>
        </select>
        <select
          value={appliesTo}
          onChange={(e) => setAppliesTo(e.target.value as WarrantyPolicyAppliesTo | "")}
          className="rounded-full border border-navy/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue"
        >
          <option value="">Aplica a: todos</option>
          <option value="mano_de_obra">Mano de obra</option>
          <option value="repuestos">Repuestos</option>
          <option value="ambas">Ambas</option>
        </select>
        <select
          value={coveredBy}
          onChange={(e) => setCoveredBy(e.target.value as WarrantyPolicyCoveredBy | "")}
          className="rounded-full border border-navy/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue"
        >
          <option value="">Quién cubre: todos</option>
          <option value="la_casa">La casa</option>
          <option value="fabrica_importador">Fábrica / Importador</option>
          <option value="proveedor">Proveedor</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
        {loading ? (
          <div className="p-12 text-center text-sm text-steel">Cargando políticas...</div>
        ) : error ? (
          <ErrorState error={error} onRetry={refresh} compact />
        ) : policies.length === 0 ? (
          <EmptyState compact title="No hay políticas de garantía todavía." />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-navy/10 bg-ash">
              <tr>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Nombre</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Aplica a</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Quién cubre</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Vigencia</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {policies.map((p) => (
                <tr
                  key={p.id}
                  className="cursor-pointer transition hover:bg-ash/60"
                  onClick={() => router.push(`/dashboard/post-ventas/politicas-garantia/${p.id}`)}
                >
                  <td className="px-6 py-4 font-semibold text-navy">{p.name}</td>
                  <td className="px-6 py-4 text-steel">{APPLIES_TO_LABELS[p.applies_to]}</td>
                  <td className="px-6 py-4 text-steel">{COVERED_BY_LABELS[p.covered_by]}</td>
                  <td className="px-6 py-4 text-steel">
                    {p.no_expiration
                      ? "Sin vencimiento"
                      : [p.duration_days != null ? `${p.duration_days} días` : null, p.duration_km != null ? `${p.duration_km.toLocaleString("es-VE")} km` : null]
                          .filter(Boolean)
                          .join(" · ")}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${p.status === "activa" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                    >
                      {p.status === "activa" ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
