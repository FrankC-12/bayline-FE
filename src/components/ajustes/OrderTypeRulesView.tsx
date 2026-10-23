"use client";
import { useAuth } from "@/contexts/AuthContext";
import { useServiceOrderTypes } from "@/hooks/useServiceOrderTypes";
const rules: Record<string, string> = {
  regular: "Visita o trabajo habitual creado desde web o app.",
  retrabajo: "Al autorizar un reclamo de garantía del taller.",
  garantia_fabrica: "Al convertir un reclamo autorizado de fábrica.",
  campana: "Al convertir una campaña o recall autorizado.",
  comeback: "Al registrar el retorno por una garantía del taller.",
};
export default function OrderTypeRulesView() {
  const { currentUser } = useAuth();
  const { orderTypes, loading, error, refresh } = useServiceOrderTypes(
    currentUser?.filialId ?? null,
  );
  return (
    <div className="rounded-2xl border border-navy/10 bg-white p-6">
      <p className="mb-5 rounded-xl bg-blue-light/40 p-4 text-sm text-navy">
        El tipo de ODS se asigna automáticamente según el origen. Esta consulta
        no cambia el tipo de órdenes existentes ni agrega un selector al crear
        una orden.
      </p>
      {loading ? (
        <p>Cargando tipos…</p>
      ) : error ? (
        <p role="alert">
          {error.message}{" "}
          <button
            type="button"
            onClick={() => void refresh()}
            className="underline"
          >
            Reintentar
          </button>
        </p>
      ) : (
        <ul className="divide-y divide-navy/10">
          {orderTypes
            .filter(
              (type) => type.is_system && type.is_active && type.code !== "mpt",
            )
            .map((type) => (
              <li key={type.id} className="py-4">
                <h3 className="font-semibold text-navy">
                  {type.name}
                  <span className="ml-2 rounded-full bg-slate-100 px-2 py-1 text-xs text-steel">
                    Automático
                  </span>
                </h3>
                <p className="mt-2 text-sm text-steel">
                  {rules[type.code] ??
                    type.description ??
                    "Se asigna según el origen de la orden."}
                </p>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
