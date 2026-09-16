"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLaborSettings } from "@/hooks/useLaborSettings";
import { useModuleAccess } from "@/hooks/useModuleAccess";

function formatRateDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-VE", { day: "numeric", month: "long", year: "numeric" });
}

export default function ParametrosView() {
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
  const [partWarrantyDays, setPartWarrantyDays] = useState("90");
  const [vehicleWarrantyMonths, setVehicleWarrantyMonths] = useState("36");
  const [workshopWarrantyDays, setWorkshopWarrantyDays] = useState("90");
  const [workshopWarrantyKm, setWorkshopWarrantyKm] = useState("5000");
  const [ivaRetention, setIvaRetention] = useState("0");
  const [islrRetention, setIslrRetention] = useState("0");
  const [manualMovementThreshold, setManualMovementThreshold] = useState("100");
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
      setPartWarrantyDays(String(settings.part_warranty_days));
      setVehicleWarrantyMonths(String(settings.vehicle_warranty_default_months));
      setWorkshopWarrantyDays(String(settings.workshop_warranty_days));
      setWorkshopWarrantyKm(String(settings.workshop_warranty_km));
      setIvaRetention(String(settings.iva_retention_default_percentage));
      setIslrRetention(String(settings.islr_retention_default_percentage));
      setManualMovementThreshold(String(settings.manual_movement_attachment_threshold_usd));
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
        part_warranty_days: Number(partWarrantyDays) || 0,
        vehicle_warranty_default_months: Number(vehicleWarrantyMonths) || 0,
        // The screen only exposes one "garantía del taller" input for now —
        // it mirrors into both the labor and parts terms so they start (and
        // stay, from this screen) equal until a future screen splits them.
        workshop_warranty_days: Number(workshopWarrantyDays) || 0,
        workshop_warranty_km: Number(workshopWarrantyKm) || 0,
        workshop_parts_warranty_days: Number(workshopWarrantyDays) || 0,
        workshop_parts_warranty_km: Number(workshopWarrantyKm) || 0,
        iva_retention_default_percentage: Number(ivaRetention) || 0,
        islr_retention_default_percentage: Number(islrRetention) || 0,
        manual_movement_attachment_threshold_usd: Number(manualMovementThreshold) || 0,
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
      </div>
    );
  }

  const inputClass =
    "w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20 disabled:bg-ash disabled:text-steel";

  return (
    <div>
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

        <section className="rounded-2xl border border-navy/10 bg-white p-6">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-widest text-blue">
            Garantías
          </p>
          <div className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">
                Días de garantía — repuestos vendidos en mostrador
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  disabled={!canEdit}
                  value={partWarrantyDays}
                  onChange={(e) => setPartWarrantyDays(e.target.value)}
                  className={inputClass}
                />
                <span className="whitespace-nowrap text-sm text-steel">días</span>
              </div>
              <p className="mt-1.5 text-xs text-steel">
                Cubre la pieza, no la instalación (el taller no la instaló). Se aplica al completar una
                Venta de Repuestos y queda atada al lote de origen para poder reclamarle al proveedor.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">
                Meses de garantía de fábrica por defecto
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  disabled={!canEdit}
                  value={vehicleWarrantyMonths}
                  onChange={(e) => setVehicleWarrantyMonths(e.target.value)}
                  className={inputClass}
                />
                <span className="whitespace-nowrap text-sm text-steel">meses</span>
              </div>
              <p className="mt-1.5 text-xs text-steel">
                Se usa al vender un vehículo nuevo en el Concesionario, cuando el sistema crea sola la garantía de fábrica del vehículo.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy">
                  Días de garantía del taller
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    disabled={!canEdit}
                    value={workshopWarrantyDays}
                    onChange={(e) => setWorkshopWarrantyDays(e.target.value)}
                    className={inputClass}
                  />
                  <span className="whitespace-nowrap text-sm text-steel">días</span>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy">
                  Kilómetros de garantía del taller
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    disabled={!canEdit}
                    value={workshopWarrantyKm}
                    onChange={(e) => setWorkshopWarrantyKm(e.target.value)}
                    className={inputClass}
                  />
                  <span className="whitespace-nowrap text-sm text-steel">km</span>
                </div>
              </div>
            </div>
            <p className="-mt-2 text-xs text-steel">
              Cubre el trabajo y los repuestos que instala el propio taller (distinto de la garantía de fábrica).
              Con estos dos valores el sistema calcula la fecha y el kilometraje de vencimiento de cada garantía
              nueva de taller.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-navy/10 bg-white p-6">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-widest text-blue">
            Retenciones (contribuyentes especiales)
          </p>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">% Retención de IVA por defecto</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  disabled={!canEdit}
                  value={ivaRetention}
                  onChange={(e) => setIvaRetention(e.target.value)}
                  className={inputClass}
                />
                <span className="whitespace-nowrap text-sm text-steel">%</span>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">% Retención de ISLR por defecto</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  disabled={!canEdit}
                  value={islrRetention}
                  onChange={(e) => setIslrRetention(e.target.value)}
                  className={inputClass}
                />
                <span className="whitespace-nowrap text-sm text-steel">%</span>
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs text-steel">
            Al facturar a un cliente tipo empresa (contribuyente especial, ej. un importador), estos porcentajes se
            precargan y se pueden ajustar por factura. La retención de IVA se calcula sobre el IVA de la factura; la de ISLR, sobre el subtotal antes de impuestos.
          </p>
        </section>

        <section className="rounded-2xl border border-navy/10 bg-white p-6">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-widest text-blue">
            Movimientos manuales de Finanzas
          </p>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">
              Monto mínimo que exige soporte (USD)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-steel">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                disabled={!canEdit}
                value={manualMovementThreshold}
                onChange={(e) => setManualMovementThreshold(e.target.value)}
                className={inputClass}
              />
            </div>
            <p className="mt-1.5 text-xs text-steel">
              Un ingreso o egreso manual por este monto o más no se puede guardar sin adjuntar un comprobante.
            </p>
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
