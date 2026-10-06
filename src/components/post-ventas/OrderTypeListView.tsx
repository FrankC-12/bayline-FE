"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useServiceOrderTypes } from "@/hooks/useServiceOrderTypes";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";

export default function OrderTypeListView() {
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;
  const router = useRouter();

  const { orderTypes, loading, error, refresh } = useServiceOrderTypes(filialId);

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold text-navy">Tipos de ODS</h1>
        <button
          onClick={() => router.push("/dashboard/post-ventas/tipos-ods/nueva")}
          className="inline-flex items-center gap-2 rounded-full bg-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy"
        >
          <Plus className="h-4 w-4" />
          Nuevo tipo
        </button>
      </div>
      <p className="mb-4 text-sm text-steel">
        Tipos seleccionables al crear una ODS. Los de sistema (Regular, Garantía de fábrica, Comeback,
        Campaña, MPT, Retrabajo) no se pueden borrar, pero puedes renombrarlos o desactivarlos.
      </p>

      <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
        {loading ? (
          <div className="p-12 text-center text-sm text-steel">Cargando tipos...</div>
        ) : error ? (
          <ErrorState error={error} onRetry={refresh} compact />
        ) : orderTypes.length === 0 ? (
          <EmptyState compact title="No hay tipos de ODS todavía." />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-navy/10 bg-ash">
              <tr>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Nombre</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Descripción</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Origen</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {orderTypes.map((t) => (
                <tr
                  key={t.id}
                  className="cursor-pointer transition hover:bg-ash/60"
                  onClick={() => router.push(`/dashboard/post-ventas/tipos-ods/${t.id}`)}
                >
                  <td className="px-6 py-4 font-semibold text-navy">{t.name}</td>
                  <td className="px-6 py-4 text-steel">{t.description || "—"}</td>
                  <td className="px-6 py-4 text-steel">{t.is_system ? "Sistema" : "Personalizado"}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${t.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                    >
                      {t.is_active ? "Activo" : "Inactivo"}
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
