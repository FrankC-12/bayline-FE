"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { useModuleAccess } from "@/hooks/useModuleAccess";
const fields = [
  ["vehicle_quote_valid_days", "Vigencia de la cotización", "días", 1, 365],
  ["vehicle_reservation_days", "Vigencia de la reserva", "días", 1, 90],
  ["vehicle_min_deposit_percentage", "Abono mínimo para reservar", "%", 0, 100],
  [
    "vehicle_discount_without_approval_percentage",
    "Descuento máximo sin aprobación",
    "%",
    0,
    100,
  ],
  [
    "vehicle_withdrawal_retention_percentage",
    "Retención al desistir de la reserva",
    "% del abono",
    0,
    100,
  ],
] as const;
export default function VehicleSalesRulesView() {
  const { currentUser } = useAuth();
  const { canEdit } = useModuleAccess("ajustes");
  const [values, setValues] = useState<Record<string, number> | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    let active = true;
    if (currentUser?.filialId)
      apiFetch<Record<string, number>>(
        `/settings?filial_id=${currentUser.filialId}`,
        { toastOnError: false },
      )
        .then((v) => {
          if (active) setValues(v);
        })
        .catch(() => {
          if (active) setMessage("No se pudieron cargar las reglas.");
        });
    return () => {
      active = false;
    };
  }, [currentUser?.filialId]);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const next = await apiFetch<Record<string, number>>(
        `/settings?filial_id=${currentUser?.filialId}`,
        {
          method: "PATCH",
          body: JSON.stringify(
            Object.fromEntries(fields.map(([key]) => [key, values?.[key]])),
          ),
          toastOnError: false,
        },
      );
      setValues(next);
      setMessage("Reglas guardadas para esta sucursal.");
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "No se pudieron guardar las reglas.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      onSubmit={save}
      className="max-w-3xl rounded-2xl border border-navy/10 bg-white p-6"
    >
      <p className="mb-6 text-sm text-steel">
        Condiciones de las nuevas cotizaciones y reservas. Las cotizaciones
        emitidas conservan su precio y vencimiento.
      </p>
      {!values ? (
        <p role="status">{message || "Cargando reglas…"}</p>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2">
            {fields.map(([key, label, unit, min, max]) => (
              <label key={key} className="text-sm font-medium">
                {label}
                <div className="mt-2 flex items-center gap-3">
                  <input
                    type="number"
                    min={min}
                    max={max}
                    step={unit === "días" ? 1 : 0.01}
                    required
                    disabled={!canEdit || busy}
                    value={values[key]}
                    onChange={(e) =>
                      setValues({ ...values, [key]: Number(e.target.value) })
                    }
                    className="w-full rounded-lg border border-navy/15 p-3"
                  />
                  <span className="shrink-0 text-xs text-steel">{unit}</span>
                </div>
              </label>
            ))}
          </div>
          <p className="mt-6 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
            La retención requiere registrar la cancelación y su devolución en
            Finanzas. Cambiar este porcentaje no realiza movimientos de dinero.
          </p>
          {canEdit && (
            <button
              disabled={busy}
              className="mt-6 rounded-lg bg-blue px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy ? "Guardando…" : "Guardar reglas"}
            </button>
          )}
          <p role="status" className="mt-4 text-sm">
            {message}
          </p>
        </>
      )}
    </form>
  );
}
