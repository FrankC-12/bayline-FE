"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { NumberInput } from "@/components/ui/NumberInput";
import { useAuth } from "@/contexts/AuthContext";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import {
  getLaborSettings,
  patchSettings,
  restoreBcv,
  type UpdateLaborSettingsInput,
} from "@/lib/api/temparios";
import { formatMoney } from "@/lib/format";
import type { LaborSettings } from "@/types/tempario";

type Field = {
  key: keyof UpdateLaborSettingsInput;
  label: string;
  unit: string;
  help?: string;
};
const FIELDS: Record<string, Field[]> = {
  impuestos: [
    {
      key: "iva_percentage",
      label: "Porcentaje de IVA",
      unit: "% sobre el subtotal",
      help: "Se aplica sobre repuestos y mano de obra al calcular el total de una Orden de Servicio.",
    },
    {
      key: "igtf_percentage",
      label: "Porcentaje de IGTF",
      unit: "% sobre el monto en USD",
      help: "Se aplica únicamente al aporte en USD, tanto en pago USD como mixto.",
    },
  ],
  retenciones: [
    {
      key: "iva_retention_default_percentage",
      label: "Retención de IVA por defecto",
      unit: "%",
    },
    {
      key: "islr_retention_default_percentage",
      label: "Retención de ISLR por defecto",
      unit: "%",
    },
  ],
  "movimientos-manuales": [
    {
      key: "manual_movement_attachment_threshold_usd",
      label: "Monto mínimo que exige soporte",
      unit: "USD",
      help: "Un ingreso o egreso manual por este monto o más exige un comprobante.",
    },
  ],
  "mano-de-obra": [
    {
      key: "hourly_rate",
      label: "Tarifa de mano de obra",
      unit: "USD / hora",
      help: "Se usa para calcular los temparios y las nuevas Órdenes de Servicio.",
    },
    {
      key: "commission_percentage",
      label: "Comisión sobre mano de obra",
      unit: "% para el técnico",
      help: "Se calcula sobre la mano de obra facturada, con las horas del tempario.",
    },
  ],
  garantias: [
    {
      key: "vehicle_warranty_default_km",
      label: "Kilómetros de garantía de fábrica",
      unit: "km",
      help: "0 = sin límite por kilometraje. Se aplica a vehículos vendidos desde este cambio; vence lo que ocurra primero.",
    },
    {
      key: "workshop_warranty_days",
      label: "Garantía estándar del taller",
      unit: "días",
    },
    {
      key: "workshop_warranty_km",
      label: "Kilómetros de garantía del taller",
      unit: "km",
      help: "Cubre mano de obra y repuestos instalados; vence lo que ocurra primero. Las órdenes cerradas conservan su garantía.",
    },
    {
      key: "part_warranty_days",
      label: "Repuestos vendidos en mostrador",
      unit: "días",
      help: "Cubre la pieza. La garantía queda vinculada al lote de origen.",
    },
    {
      key: "vehicle_warranty_default_months",
      label: "Vehículos nuevos vendidos: garantía de fábrica",
      unit: "meses",
      help: "Se crea automáticamente al vender un vehículo nuevo en el Concesionario.",
    },
  ],
};
export default function SettingsSectionView({
  section,
  onDirtyChange,
}: {
  section: string;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId;
  const { canEdit } = useModuleAccess("ajustes");
  const [settings, setSettings] = useState<LaborSettings | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [manual, setManual] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const fields = FIELDS[section] ?? [];
  useEffect(() => {
    let active = true;
    if (!filialId) return;
    getLaborSettings(filialId)
      .then((data) => {
        if (active) {
          setSettings(data);
          setValues(
            Object.fromEntries(
              fields.map((field) => [
                field.key,
                String(data[field.key as keyof LaborSettings] ?? 0),
              ]),
            ),
          );
        }
      })
      .catch((err) => {
        if (active)
          setError(
            err instanceof Error ? err.message : "No se pudo cargar Ajustes.",
          );
      });
    return () => {
      active = false;
    };
    // Each section mounts a fresh form; fields are static.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filialId, section]);
  const dirty =
    !!settings &&
    (manual ||
      Object.entries(values).some(
        ([key, value]) =>
          Number(value) !== Number(settings[key as keyof LaborSettings]),
      ));
  useEffect(() => {
    onDirtyChange(dirty);
    return () => onDirtyChange(false);
  }, [dirty, onDirtyChange]);
  useEffect(() => {
    if (!dirty) return;
    function warn(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  useEffect(() => {
    if (!dirty) return;
    function intercept(event: MouseEvent) {
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.shiftKey
      )
        return;
      const link = (event.target as Element)?.closest<HTMLAnchorElement>(
        "a[href]",
      );
      if (!link || link.target === "_blank" || link.hasAttribute("download"))
        return;
      const url = new URL(link.href, window.location.href);
      if (
        url.origin !== window.location.origin ||
        (url.pathname === window.location.pathname &&
          url.search === window.location.search)
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      setPendingHref(url.pathname + url.search + url.hash);
    }
    document.addEventListener("click", intercept, true);
    return () => document.removeEventListener("click", intercept, true);
  }, [dirty]);
  async function save() {
    if (!filialId || !settings || busy) return;
    setError(null);
    const entries = Object.entries(values).filter(
      ([key, value]) =>
        (key === "bcv_rate" && manual) ||
        Number(value) !== Number(settings[key as keyof LaborSettings]),
    );
    if (
      entries.some(
        ([key, value]) =>
          !value.trim() ||
          !Number.isFinite(Number(value)) ||
          Number(value) < 0 ||
          (key.includes("percentage") && Number(value) > 100) ||
          (key === "bcv_rate" && Number(value) <= 0) ||
          ((key.endsWith("days") ||
            key.endsWith("months") ||
            key.endsWith("km")) &&
            !Number.isInteger(Number(value))),
      )
    ) {
      setError(
        "Revisa los valores: usa números válidos y porcentajes entre 0 y 100.",
      );
      return;
    }
    setBusy(true);
    try {
      const updated = await patchSettings(
        filialId,
        Object.fromEntries(entries.map(([key, value]) => [key, Number(value)])),
      );
      setSettings(updated);
      setSaved(true);
      setManual(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  }
  async function restore() {
    if (!filialId || busy) return;
    setBusy(true);
    setError(null);
    try {
      const data = await restoreBcv(filialId);
      setSettings(data);
      setValues((prev) => {
        const next = { ...prev };
        delete next.bcv_rate;
        return next;
      });
      setManual(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo restaurar.");
    } finally {
      setBusy(false);
    }
  }
  if (!settings)
    return (
      <p
        role={error ? "alert" : undefined}
        className="rounded-2xl bg-white p-8 text-sm text-steel"
      >
        {error ?? "Cargando Ajustes…"}
      </p>
    );
  return (
    <div className="space-y-5">
      <ConfirmDialog
        open={!!pendingHref}
        title="Tienes cambios sin guardar"
        description="Guarda los cambios de esta sección o confirma que deseas descartarlos."
        confirmLabel="Descartar y salir"
        onCancel={() => setPendingHref(null)}
        onConfirm={() => {
          if (pendingHref) {
            onDirtyChange(false);
            router.push(pendingHref);
            setPendingHref(null);
          }
        }}
      />
      <p className="text-sm text-steel">
        Los cambios aplican a órdenes nuevas. Las ODS existentes conservan sus
        valores.
      </p>
      <section className="rounded-2xl border border-navy/10 bg-white p-6">
        <div className="grid gap-6 sm:grid-cols-2">
          {fields.map((field) => {
            const change = settings.field_changes?.[field.key];
            return (
              <div key={field.key}>
                <label
                  htmlFor={field.key}
                  className="mb-2 block text-sm font-semibold text-navy"
                >
                  {field.label}
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <NumberInput
                    id={field.key}
                    min={0}
                    max={field.key.includes("percentage") ? 100 : undefined}
                    step={
                      field.key.endsWith("days") ||
                      field.key.endsWith("months") ||
                      field.key.endsWith("km")
                        ? 1
                        : 0.01
                    }
                    value={values[field.key] ?? ""}
                    disabled={!canEdit || busy}
                    onValueChange={(value) => {
                      setValues((prev) => ({ ...prev, [field.key]: value }));
                      setSaved(false);
                    }}
                    className="w-32 rounded-xl border border-navy/15 px-3 py-2.5 text-right text-sm font-semibold disabled:bg-ash"
                  />
                  <span className="text-sm text-steel">{field.unit}</span>
                </div>
                {field.help && (
                  <p className="mt-2 text-xs leading-relaxed text-steel">
                    {field.help}
                  </p>
                )}
                <p className="mt-4 text-xs text-steel">
                  Último cambio: {change?.user_name ?? "Sin registro anterior"}
                  {change &&
                    ` · ${new Date(change.changed_at).toLocaleString("es-VE")}`}
                </p>
              </div>
            );
          })}
        </div>
        {section === "retenciones" && (
          <p className="mt-5 text-xs text-steel">
            Se precargan para contribuyentes especiales y se pueden ajustar por
            factura. La retención de IVA se calcula sobre el IVA; ISLR, sobre el
            subtotal.
          </p>
        )}
        {section === "mano-de-obra" && (
          <Link
            href="/dashboard/ajustes/temparios"
            className="mt-5 inline-block text-sm font-semibold text-blue"
          >
            Ver temparios que usan esta tarifa →
          </Link>
        )}
      </section>
      {section === "impuestos" && (
        <section className="rounded-2xl border border-navy/10 bg-white p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-xs uppercase tracking-widest text-blue">
              Tasa BCV del día (Bs. por USD)
            </p>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${settings.bcv_rate_mode === "manual" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-700"}`}
            >
              {settings.bcv_rate_mode === "manual" ? "Manual" : "Automático"}
            </span>
          </div>
          <p className="my-4 font-display text-3xl font-bold text-navy">
            Bs. {formatMoney(settings.bcv_rate, 4)}
          </p>
          <p className="text-xs text-steel">
            Última actualización: {settings.bcv_rate_date ?? "No disponible"}.
            {settings.bcv_rate_is_stale && " La tasa está vencida."}
          </p>
          {canEdit && (
            <div className="mt-4 flex flex-wrap gap-3">
              {manual ? (
                <NumberInput
                  min={0.0001}
                  step={0.0001}
                  value={values.bcv_rate ?? String(settings.bcv_rate)}
                  disabled={busy}
                  onValueChange={(value) =>
                    setValues((prev) => ({ ...prev, bcv_rate: value }))
                  }
                  className="w-48 rounded-xl border border-navy/15 px-3 py-2"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setManual(true);
                    setValues((prev) => ({
                      ...prev,
                      bcv_rate: String(settings.bcv_rate),
                    }));
                  }}
                  className="rounded-full border border-navy/15 px-4 py-2 text-sm font-semibold"
                >
                  Forzar valor manual
                </button>
              )}
              {settings.bcv_rate_mode === "manual" && (
                <button
                  disabled={busy}
                  type="button"
                  onClick={() => void restore()}
                  className="rounded-full border border-navy/15 px-4 py-2 text-sm font-semibold"
                >
                  Restaurar valor BCV
                </button>
              )}
            </div>
          )}
        </section>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      {saved && !dirty && (
        <p role="status" className="text-sm text-emerald-700">
          Cambios guardados.
        </p>
      )}
      {canEdit && dirty && (
        <div className="sticky bottom-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue/20 bg-white p-4 shadow-lg">
          <p className="text-sm font-semibold text-navy">
            Tienes cambios sin guardar
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setValues(
                Object.fromEntries(
                  Object.keys(values).map((key) => [
                    key,
                    String(settings[key as keyof LaborSettings]),
                  ]),
                ),
              );
              setManual(false);
            }}
            className="text-sm font-semibold text-steel"
          >
            Descartar cambios
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void save()}
            className="rounded-full bg-blue px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      )}
    </div>
  );
}
