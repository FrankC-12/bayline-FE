"use client";
import { useEffect, useRef, useState } from "react";
import WarrantyCoverage from "./WarrantyCoverage";
import { assessClaimCoverage } from "@/lib/claimCoverage";
import Modal from "@/components/common/Modal";
import { NumberInput } from "@/components/ui/NumberInput";
import { useVehicleLookup } from "@/hooks/useVehicleLookUp";
import {
  createClaimFromWarranty,
  getWarrantyClaimContext,
} from "@/lib/api/warrantyClaims";
import type { WarrantyClaimContext } from "@/types/warrantyClaim";
export default function NewWarrantyClaim({
  filialId,
  onClose,
  onCreated,
  initialVehicleId = "",
  initialCoverage = "",
  initialServiceOrderId,
}: {
  initialServiceOrderId?: string;
  initialVehicleId?: string;
  initialCoverage?: string;
  filialId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { vehicleMap } = useVehicleLookup(filialId);
  const submitting = useRef(false);
  const [step, setStep] = useState(1),
    [vehicle, setVehicle] = useState(initialVehicleId),
    [coverage, setCoverage] = useState(""),
    [mileage, setMileage] = useState(""),
    [symptom, setSymptom] = useState("");
  const [context, setContext] = useState<WarrantyClaimContext | null>(null),
    [loading, setLoading] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [photos, setPhotos] = useState<File[]>([]),
    [documents, setDocuments] = useState<File[]>([]);
  const [odometer, setOdometer] = useState<File | null>(null);
  useEffect(() => {
    if (!vehicle) return;
    let alive = true;
    setLoading(true);
    setPhotos([]);
    setDocuments([]);
    setSymptom("");
    setMileage("");
    setOdometer(null);
    setContext(null);
    setCoverage("");
    setError("");
    getWarrantyClaimContext(
      vehicle,
      vehicle === initialVehicleId ? initialServiceOrderId : undefined,
    )
      .then((c) => {
        if (alive) {
          setContext(c);
          setCoverage(initialCoverage);
          setMileage("");
          setOdometer(null);
        }
      })
      .catch((e) => {
        if (alive) setError(e.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [vehicle, initialCoverage, initialVehicleId, initialServiceOrderId]);
  const options = [
    ...(context?.workshop_warranties ?? []).map((w) => ({
      id: `workshop:${w.id}`,
      assessment: assessClaimCoverage(
        { ...w, kind: "workshop" },
        mileage === "" ? (context?.current_mileage ?? null) : Number(mileage),
      ),
      label: `${w.tempario_name_snapshot} · ${w.duration_days ?? "—"} días / ${w.duration_km ?? "—"} km`,
      expired:
        w.status !== "vigente" ||
        (w.expiration_mileage != null &&
          (mileage === ""
            ? (context?.current_mileage ?? 0)
            : Number(mileage)) >= w.expiration_mileage),
    })),
    ...(context?.factory_warranty
      ? [
          {
            id: `factory:${context.factory_warranty.id}`,
            assessment: assessClaimCoverage(
              { ...context.factory_warranty, kind: "factory" },
              mileage === ""
                ? (context?.current_mileage ?? null)
                : Number(mileage),
            ),
            label: `Fábrica · ${context.factory_warranty.duration_months ?? "—"} meses / ${context.factory_warranty.duration_km ?? "—"} km`,
            expired:
              context.factory_warranty.status !== "vigente" ||
              (context.factory_warranty.duration_km != null &&
                (mileage === ""
                  ? (context?.current_mileage ?? 0)
                  : Number(mileage)) >= context.factory_warranty.duration_km),
          },
        ]
      : []),
    {
      id: "campaign",
      label: "Campaña o recall",
      expired: false,
      assessment: assessClaimCoverage({ kind: "campaign" }, null),
    },
  ];
  const valid =
    !!coverage && options.some((o) => o.id === coverage && !o.expired);
  async function submit() {
    if (
      submitting.current ||
      !valid ||
      !odometer ||
      mileage === "" ||
      !Number.isInteger(Number(mileage)) ||
      Number(mileage) < (context?.current_mileage ?? 0)
    )
      return;
    submitting.current = true;
    setBusy(true);
    setError("");
    const form = new FormData();
    form.set("vehicle_id", vehicle);
    form.set("reported_mileage", mileage);
    form.set("odometer_photo", odometer);
    form.set("symptom", symptom.trim());
    if (coverage === "campaign") form.set("campaign", "true");
    else {
      const [kind, id] = coverage.split(":");
      form.set(
        kind === "workshop" ? "workshop_warranty_id" : "factory_warranty_id",
        id,
      );
    }
    photos.forEach((f) => form.append("photos", f));
    documents.forEach((f) => form.append("documents", f));
    try {
      await createClaimFromWarranty(form);
      onCreated();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo registrar el reclamo.",
      );
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  return (
    <Modal
      open
      placement="right"
      onClose={onClose}
      closeDisabled={busy}
      title="Nuevo reclamo"
      description={`Paso ${step} de 3 · ${["Vehículo", "Garantía reclamada", "Lo que reporta el cliente"][step - 1]}`}
      size="lg"
      footer={
        <>
          <button
            disabled={busy}
            onClick={() => (step === 1 ? onClose() : setStep(step - 1))}
            className="rounded-full border border-navy/15 px-5 py-2.5 text-sm"
          >
            {step === 1 ? "Cancelar" : "Atrás"}
          </button>
          {step < 3 ? (
            <button
              disabled={!vehicle || loading || (step === 2 && !valid)}
              onClick={() => setStep(step + 1)}
              className="rounded-full bg-blue px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
            >
              Continuar
            </button>
          ) : (
            <button
              disabled={
                busy ||
                !valid ||
                symptom.trim().length < 3 ||
                !mileage ||
                !odometer ||
                !Number.isInteger(Number(mileage)) ||
                Number(mileage) < (context?.current_mileage ?? 0)
              }
              onClick={() => void submit()}
              className="rounded-full bg-blue px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
            >
              {busy ? "Guardando…" : "Registrar reclamo"}
            </button>
          )}
        </>
      }
    >
      <div className="space-y-5 p-6">
        {error && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        {step === 1 ? (
          <label className="block text-sm font-semibold text-navy">
            Vehículo y cliente
            <select
              value={vehicle}
              onChange={(e) => setVehicle(e.target.value)}
              className="mt-2 w-full rounded-xl border border-navy/15 p-3 text-sm"
            >
              <option value="">Selecciona un vehículo</option>
              {Array.from(vehicleMap.values()).map((v) => (
                <option key={v.vehicle.id} value={v.vehicle.id}>
                  {v.vehicle.brand} {v.vehicle.model} ·{" "}
                  {v.vehicle.plate ?? "Sin placa"} · {v.client.full_name}
                </option>
              ))}
            </select>
          </label>
        ) : step === 2 ? (
          <>
            {loading ? (
              <p>Cargando garantías…</p>
            ) : (
              <div className="space-y-3">
                {options.map((o) => (
                  <label
                    key={o.id}
                    className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${o.expired ? "border-navy/5 bg-slate-50 text-steel" : "border-navy/15 text-navy"}`}
                  >
                    <input
                      type="radio"
                      name="coverage"
                      checked={coverage === o.id}
                      disabled={o.expired}
                      onChange={() => setCoverage(o.id)}
                      className="mt-1"
                    />
                    <span>
                      {o.label}
                      {o.expired && (
                        <span className="ml-2 rounded-full bg-slate-200 px-2 py-1 text-xs">
                          Vencida
                        </span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            )}
            {coverage && (
              <WarrantyCoverage
                assessment={options.find((o) => o.id === coverage)?.assessment}
                note="Referencia con el último kilometraje registrado. La lectura real se confirma con foto del tablero en el siguiente paso."
              />
            )}
            <p className="text-xs text-steel">
              El tipo de reclamo, la ODS de origen y el servicio se toman de la
              garantía elegida.
            </p>
          </>
        ) : (
          <>
            <label className="block text-sm font-semibold text-navy">
              Kilometraje de hoy
              <NumberInput
                min={0}
                value={mileage}
                onValueChange={setMileage}
                className="mt-2 w-full rounded-xl border border-navy/15 p-3"
              />
            </label>
            <p className="text-xs text-steel">
              Último registro:{" "}
              {context?.current_mileage == null
                ? "Sin kilometraje previo"
                : `${context.current_mileage.toLocaleString("es-VE")} km`}
              . Ingresa la lectura de hoy; no puede ser menor.
            </p>
            <label className="block text-sm font-semibold text-navy">
              Foto del tablero (obligatoria)
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                onChange={(e) => setOdometer(e.target.files?.[0] ?? null)}
                className="mt-2 block w-full text-xs"
              />
              {odometer && (
                <span className="mt-1 block text-xs font-normal text-steel">
                  {odometer.name}
                </span>
              )}
            </label>
            {coverage && (
              <WarrantyCoverage
                assessment={options.find((o) => o.id === coverage)?.assessment}
                note={
                  mileage === ""
                    ? "Referencia con el último kilometraje registrado; ingresa la lectura de hoy."
                    : "Verificación con el kilometraje de hoy. Vence lo que ocurra primero."
                }
              />
            )}
            {!valid && (
              <p role="alert" className="text-sm text-red-700">
                El kilometraje está fuera de cobertura. Regresa para seleccionar
                otra garantía.
              </p>
            )}
            <label className="block text-sm font-semibold text-navy">
              ¿Qué reporta el cliente?
              <textarea
                rows={4}
                value={symptom}
                onChange={(e) => setSymptom(e.target.value)}
                className="mt-2 w-full rounded-xl border border-navy/15 p-3 font-normal"
              />
            </label>
            <label className="block text-sm font-semibold text-navy">
              Fotos (opcional)
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setPhotos(Array.from(e.target.files ?? []))}
                className="mt-2 block w-full text-xs"
              />
            </label>
            <label className="block text-sm font-semibold text-navy">
              Documentos (opcional)
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={(e) => setDocuments(Array.from(e.target.files ?? []))}
                className="mt-2 block w-full text-xs"
              />
            </label>
            <p className="text-xs text-steel">
              La fecha se registra automáticamente. La cobertura se verifica con
              el kilometraje y la fecha actuales.
            </p>
          </>
        )}
      </div>
    </Modal>
  );
}
