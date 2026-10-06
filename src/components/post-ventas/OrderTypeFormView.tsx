"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useServiceOrderTypes } from "@/hooks/useServiceOrderTypes";

interface OrderTypeFormViewProps {
  /** When set, edits that existing tipo de ODS instead of creating a new one. */
  orderTypeId?: string;
}

export default function OrderTypeFormView({ orderTypeId }: OrderTypeFormViewProps) {
  const router = useRouter();
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;
  const { orderTypes, loading, addOrderType, editOrderType } = useServiceOrderTypes(filialId);
  const existing = orderTypeId ? orderTypes.find((t) => t.id === orderTypeId) : undefined;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!existing) return;
    setName(existing.name);
    setDescription(existing.description ?? "");
    setIsActive(existing.is_active);
  }, [existing]);

  async function handleSubmit() {
    if (!filialId) return;
    if (!name.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (orderTypeId) {
        await editOrderType(orderTypeId, {
          name: name.trim(),
          description: description.trim() || null,
          is_active: isActive,
        });
      } else {
        await addOrderType({ filial_id: filialId, name: name.trim(), description: description.trim() || null });
      }
      router.push("/dashboard/post-ventas/tipos-ods");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el tipo de ODS.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!filialId || (orderTypeId && loading)) {
    return <div className="p-12 text-center text-sm text-steel">Cargando...</div>;
  }

  return (
    <div>
      <Link
        href="/dashboard/post-ventas/tipos-ods"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-steel hover:text-navy"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver
      </Link>

      <h1 className="mb-6 font-display text-3xl font-bold text-navy">
        {orderTypeId ? "Editar tipo de ODS" : "Nuevo tipo de ODS"}
      </h1>

      <div className="max-w-2xl space-y-5">
        <div className="rounded-2xl border border-navy/10 bg-white p-6">
          <label className="mb-1.5 block text-sm font-medium text-navy">Nombre</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Revisión pre-entrega"
            className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
          />
        </div>

        <div className="rounded-2xl border border-navy/10 bg-white p-6">
          <label className="mb-1.5 block text-sm font-medium text-navy">Descripción</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Para qué se usa este tipo de orden..."
            className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
          />
        </div>

        {orderTypeId && (
          <div className="rounded-2xl border border-navy/10 bg-white p-6">
            <label className="flex items-center gap-2 text-sm font-medium text-navy">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              Activo (disponible al crear una ODS)
            </label>
          </div>
        )}

        {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="flex items-center justify-center gap-2 rounded-full bg-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-50"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Guardar
        </button>
      </div>
    </div>
  );
}
