"use client";

import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import type { LaborSettings } from "@/types/tempario";
import type { UpdateLaborSettingsInput } from "@/lib/api/temparios";

interface LaborSettingsModalProps {
  open: boolean;
  onClose: () => void;
  settings: LaborSettings | null;
  onSave: (input: UpdateLaborSettingsInput) => Promise<unknown>;
}

export default function LaborSettingsModal({ open, onClose, settings, onSave }: LaborSettingsModalProps) {
  const [hourlyRate, setHourlyRate] = useState("25");
  const [commission, setCommission] = useState("30");
  const [igtf, setIgtf] = useState("3");
  const [iva, setIva] = useState("16");
  const [bcvRate, setBcvRate] = useState("0");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (settings && open) {
      setHourlyRate(String(settings.hourly_rate));
      setCommission(String(settings.commission_percentage));
      setIgtf(String(settings.igtf_percentage));
      setIva(String(settings.iva_percentage));
      setBcvRate(String(settings.bcv_rate));
    }
  }, [settings, open]);

  async function handleSave() {
    setSubmitting(true);
    setError(null);
    try {
      await onSave({
        hourly_rate: Number(hourlyRate) || 0,
        commission_percentage: Number(commission) || 0,
        igtf_percentage: Number(igtf) || 0,
        iva_percentage: Number(iva) || 0,
        bcv_rate: Number(bcvRate) || 0,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la configuración.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-navy/40" />
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-navy/10 px-6 py-4">
          <h2 className="font-display text-lg font-bold text-navy">Ajustes de mano de obra</h2>
          <button onClick={onClose} aria-label="Cerrar" className="rounded-lg p-2 text-steel hover:bg-ash hover:text-navy">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <p className="text-sm text-steel">
            Esta tarifa se usa para calcular la mano de obra en <span className="font-semibold">todos los temparios</span> y en el precio final de las Órdenes de Servicio.
          </p>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Tarifa de mano de obra (USD por hora)</label>
            <div className="flex items-center gap-2">
              <span className="text-steel">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
              />
              <span className="whitespace-nowrap text-sm text-steel">/ hora</span>
            </div>
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
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
                className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
              />
              <span className="whitespace-nowrap text-sm text-steel">% para el técnico</span>
            </div>
            <p className="mt-1.5 text-xs text-steel">
              Usado para calcular el Split de Comisión entre técnicos que trabajan una misma tarea.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Porcentaje de IGTF</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                value={igtf}
                onChange={(e) => setIgtf(e.target.value)}
                className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
              />
              <span className="whitespace-nowrap text-sm text-steel">% sobre el monto en USD</span>
            </div>
            <p className="mt-1.5 text-xs text-steel">
              Se aplica a pagos en efectivo/divisa (método de pago Mixto) al facturar una orden o venta.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Porcentaje de IVA</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                value={iva}
                onChange={(e) => setIva(e.target.value)}
                className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
              />
              <span className="whitespace-nowrap text-sm text-steel">% sobre el subtotal</span>
            </div>
            <p className="mt-1.5 text-xs text-steel">
              Se aplica sobre repuestos + mano de obra al calcular el total de una Orden de Servicio.
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
                value={bcvRate}
                onChange={(e) => setBcvRate(e.target.value)}
                className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
              />
            </div>
            <p className="mt-1.5 text-xs text-steel">
              Se usa para convertir montos a bolívares al facturar con método Bs. o Mixto.
            </p>
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 border-t border-navy/10 p-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-navy/15 px-5 py-2.5 text-sm font-semibold text-navy transition hover:border-navy/40"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={submitting}
            className="flex items-center justify-center gap-2 rounded-full bg-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}