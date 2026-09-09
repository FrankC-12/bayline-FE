"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ChevronLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLaborSettings } from "@/hooks/useLaborSettings";
import { useModuleAccess } from "@/hooks/useModuleAccess";

function formatRateDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-VE", { day: "numeric", month: "long", year: "numeric" });
}

export default function AjustesView() {
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;

  const { settings, loading, error, save } = useLaborSettings(filialId);
  const { canEdit } = useModuleAccess("ajustes");

  const [hourlyRate, setHourlyRate] = useState("25");
  const [commission, setCommission] = useState("30");
  const [igtf, setIgtf] = useState("3");
  const [iva, setIva] = useState("16");
  const [bcvRate, setBcvRate] = useState("0");
  const [bcvRateTouched, setBcvRateTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setHourlyRate(String(settings.hourly_rate));
      setCommission(String(settings.commission_percentage));
      setIgtf(String(settings.igtf_percentage));
      setIva(String(settings.iva_percentage));
      setBcvRate(String(settings.bcv_rate));
      setBcvRateTouched(false);
    }
  }, [settings]);

  async function handleSave() {
    if (bcvRateTouched && (Number(bcvRate) || 0) <= 0) {
      setSaveError("La tasa BCV debe ser mayor a cero.");
      return;
    }
    setSubmitting(true);
    setSaveError(null);
    setSaved(false);
    try {
      await save({
        hourly_rate: Number(hourlyRate) || 0,
        commission_percentage: Number(commission) || 0,
        igtf_percentage: Number(igtf) || 0,
        iva_percentage: Number(iva) || 0,
        // Omitted unless the user explicitly edits it, so saving anything
        // else never overwrites the auto-synced BCV value.
        ...(bcvRateTouched ? { bcv_rate: Number(bcvRate) || 0 } : {}),
      });
      setSaved(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "No se pudo guardar la configuración.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="p-12 text-center text-sm text-steel">Cargando Ajustes...</div>;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
        <h1 className="mt-4 font-display text-xl font-bold text-navy">No se pudo cargar Ajustes</h1>
        <p className="mt-2 text-sm text-steel">{error}</p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-steel hover:text-navy"
        >
          <ChevronLeft className="h-4 w-4" />
          Volver al Dashboard
        </Link>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20 disabled:bg-ash disabled:text-steel";

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-steel hover:text-navy"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver al Dashboard
      </Link>
      <h1 className="font-display text-3xl font-bold text-navy">Ajustes</h1>
      <p className="mt-1 text-sm text-steel">
        Parámetros financieros y operativos que afectan a todo el negocio.
      </p>
      {!canEdit && (
        <p className="mt-3 rounded-lg bg-ash px-3 py-2 text-xs text-steel">
          Tienes acceso de solo lectura a este módulo.
        </p>
      )}

      <div className="mt-6 space-y-6">
        <section className="rounded-2xl border border-navy/10 bg-white p-6">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-widest text-blue">
            Parámetros financieros
          </p>
          <div className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">Porcentaje de IVA</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  disabled={!canEdit}
                  value={iva}
                  onChange={(e) => setIva(e.target.value)}
                  className={inputClass}
                />
                <span className="whitespace-nowrap text-sm text-steel">% sobre el subtotal</span>
              </div>
              <p className="mt-1.5 text-xs text-steel">
                Se aplica sobre repuestos + mano de obra al calcular el total de una Orden de Servicio.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">Porcentaje de IGTF</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  disabled={!canEdit}
                  value={igtf}
                  onChange={(e) => setIgtf(e.target.value)}
                  className={inputClass}
                />
                <span className="whitespace-nowrap text-sm text-steel">% sobre el monto en USD</span>
              </div>
              <p className="mt-1.5 text-xs text-steel">
                En facturación de ODS se aplica únicamente sobre el aporte en USD, tanto en pago USD como Mixto.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">Tasa BCV del día (Bs. por USD)</label>
              <div className="flex items-center gap-2">
                <span className="text-steel">Bs.</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  disabled={!canEdit}
                  value={bcvRate}
                  onChange={(e) => {
                    setBcvRate(e.target.value);
                    setBcvRateTouched(true);
                  }}
                  className={inputClass}
                />
              </div>
              <p className="mt-1.5 text-xs text-steel">
                Se carga automáticamente desde el BCV.
                {settings?.bcv_rate_date && ` Última actualización: ${formatRateDate(settings.bcv_rate_date)}.`}
                {" "}Edítala solo para forzar un valor manual.
              </p>
              {settings?.bcv_rate_is_stale && (
                <p className="mt-1.5 flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  Tasa BCV vencida — todavía no se ha actualizado hoy.
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-navy/10 bg-white p-6">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-widest text-blue">
            Parámetros operativos
          </p>
          <div className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">
                Tarifa de mano de obra (USD por hora)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-steel">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  disabled={!canEdit}
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  className={inputClass}
                />
                <span className="whitespace-nowrap text-sm text-steel">/ hora</span>
              </div>
              <p className="mt-1.5 text-xs text-steel">
                Se usa para calcular la mano de obra en todos los temparios y en el precio final de las Órdenes de Servicio.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">
                Porcentaje de comisión sobre mano de obra
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  disabled={!canEdit}
                  value={commission}
                  onChange={(e) => setCommission(e.target.value)}
                  className={inputClass}
                />
                <span className="whitespace-nowrap text-sm text-steel">% para el técnico</span>
              </div>
              <p className="mt-1.5 text-xs text-steel">
                Usado para calcular el Split de Comisión entre técnicos que trabajan una misma tarea.
              </p>
            </div>
          </div>
        </section>

        {saveError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{saveError}</p>}
        {saved && !saveError && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Cambios guardados.
          </p>
        )}

        {canEdit && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={submitting}
              className="flex items-center justify-center gap-2 rounded-full bg-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Guardar cambios
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
