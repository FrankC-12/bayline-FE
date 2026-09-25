"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Pencil } from "lucide-react";
import { getWarrantyPolicy } from "@/lib/api/warrantyPolicies";
import type { WarrantyPolicy } from "@/types/warrantyPolicy";

const APPLIES_TO_LABELS = {
  mano_de_obra: "Mano de obra",
  repuestos: "Repuestos",
  ambas: "Ambas",
} as const;

const COVERED_BY_LABELS = {
  la_casa: "La casa",
  fabrica_importador: "Fábrica / Importador",
  proveedor: "Proveedor",
} as const;

const SCOPE_LABELS = {
  solo_pieza: "Solo la pieza",
  pieza_mas_instalacion: "Pieza + instalación",
} as const;

interface WarrantyPolicyDetailViewProps {
  policyId: string;
}

export default function WarrantyPolicyDetailView({ policyId }: WarrantyPolicyDetailViewProps) {
  const [policy, setPolicy] = useState<WarrantyPolicy | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setPolicy(await getWarrantyPolicy(policyId));
      setLoading(false);
    })();
  }, [policyId]);

  if (loading || !policy) {
    return <div className="p-12 text-center text-sm text-steel">Cargando política...</div>;
  }

  return (
    <div>
      <Link
        href="/dashboard/post-ventas/politicas-garantia"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-steel hover:text-navy"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver a políticas de garantía
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-navy">{policy.name}</h1>
          <span
            className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${policy.status === "activa" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
          >
            {policy.status === "activa" ? "Activa" : "Inactiva"}
          </span>
        </div>
        <Link
          href={`/dashboard/post-ventas/politicas-garantia/${policy.id}/editar`}
          className="inline-flex items-center gap-1.5 rounded-full border border-navy/15 px-5 py-2.5 text-sm font-semibold text-navy transition hover:border-navy/40"
        >
          <Pencil className="h-3.5 w-3.5" />
          Editar
        </Link>
      </div>

      <div className="rounded-2xl border border-navy/10 bg-white p-6">
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-widest text-steel">Aplica a</dt>
            <dd className="mt-1 font-medium text-navy">{APPLIES_TO_LABELS[policy.applies_to]}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-widest text-steel">Quién cubre</dt>
            <dd className="mt-1 font-medium text-navy">{COVERED_BY_LABELS[policy.covered_by]}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-widest text-steel">Alcance</dt>
            <dd className="mt-1 font-medium text-navy">{SCOPE_LABELS[policy.scope]}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-widest text-steel">Vigencia</dt>
            <dd className="mt-1 font-medium text-navy">
              {policy.no_expiration
                ? "Sin vencimiento"
                : [
                    policy.duration_days != null ? `${policy.duration_days} días` : null,
                    policy.duration_km != null ? `${policy.duration_km.toLocaleString("es-VE")} km` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "—"}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-navy/10 bg-white p-6">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-steel">Temparios cubiertos</p>
          {policy.temparios.length === 0 ? (
            <p className="text-sm text-steel">Sin temparios vinculados.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {policy.temparios.map((t) => (
                <li key={t.id}>
                  <span className="font-mono text-blue">{t.tempario_code}</span> <span className="text-navy">{t.tempario_name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-2xl border border-navy/10 bg-white p-6">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-steel">Repuestos cubiertos</p>
          {policy.parts.length === 0 ? (
            <p className="text-sm text-steel">Sin repuestos vinculados.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {policy.parts.map((p) => (
                <li key={p.id}>
                  <span className="font-mono text-blue">{p.part_code}</span> <span className="text-navy">{p.part_name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
