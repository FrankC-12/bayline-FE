"use client";
import { useState } from "react";
import { NumberInput } from "@/components/ui/NumberInput";
import {
  uploadVehicleDocument,
  type UpdateVehicleInput,
} from "@/lib/api/concesionario";
import { inventoryMileageError } from "@/lib/inventory-mileage";
import type { DealershipVehicle } from "@/types/concesionario";
import VehicleSpecificationsFields from "./VehicleSpecificationsFields";
const labels = {
  brand: "Marca",
  model: "Modelo",
  version: "Versión",
  vin: "VIN",
  plate: "Placa",
  sku: "SKU",
  color: "Color",
};
const priceLabels = {
  price_cash: "Precio de contado",
  price_financed: "Precio financiado",
  cost_price: "Costo de adquisición",
  iva_percentage: "IVA (%)",
  igtf_percentage: "IGTF (%)",
  luxury_tax_percentage: "Impuesto al lujo (%)",
};
export default function EditInventoryVehicleModal({
  vehicle,
  onClose,
  onSave,
}: {
  vehicle: DealershipVehicle;
  onClose: () => void;
  onSave: (input: UpdateVehicleInput) => Promise<void>;
}) {
  const [data, setData] = useState(() => ({
    brand: vehicle.brand,
    model: vehicle.model,
    version: vehicle.version ?? "",
    vin: vehicle.vin,
    plate: vehicle.plate ?? "",
    sku: vehicle.sku,
    color: vehicle.color ?? "",
  }));
  const [condition, setCondition] = useState(vehicle.condition);
  const [year, setYear] = useState(String(vehicle.year));
  const [mileage, setMileage] = useState(
    vehicle.mileage == null ? "" : String(vehicle.mileage),
  );
  const [specs, setSpecs] = useState({
    engine_type: vehicle.engine_type ?? "",
    seats: String(vehicle.seats ?? ""),
    upholstery: vehicle.upholstery ?? "",
    previous_owners: String(vehicle.previous_owners ?? ""),
  });
  const [prices, setPrices] = useState(() =>
    Object.fromEntries(
      Object.keys(priceLabels).map((key) => [
        key,
        String(vehicle[key as keyof DealershipVehicle] ?? ""),
      ]),
    ),
  );
  const [fuel, setFuel] = useState(vehicle.fuel_type ?? "");
  const [transmission, setTransmission] = useState(vehicle.transmission ?? "");
  const [currency, setCurrency] = useState(vehicle.price_currency);
  const [estimated, setEstimated] = useState(vehicle.cost_is_estimated);
  const [provider, setProvider] = useState(vehicle.financing_provider ?? "");
  const [reason, setReason] = useState("");
  const [documents, setDocuments] = useState<Record<string, File>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function save() {
    if (busy) return;
    const issue = inventoryMileageError(condition, mileage);
    if (issue) {
      setError(issue);
      return;
    }
    if (
      !data.brand.trim() ||
      !data.model.trim() ||
      !data.sku.trim() ||
      !data.vin.trim()
    ) {
      setError("Completa marca, modelo, VIN y SKU.");
      return;
    }
    const input: UpdateVehicleInput = {
      ...data,
      condition,
      year: Number(year),
      mileage: mileage ? Number(mileage) : null,
      engine_type: specs.engine_type || null,
      seats: specs.seats ? Number(specs.seats) : null,
      upholstery: specs.upholstery || null,
      previous_owners:
        condition === "usado" && specs.previous_owners
          ? Number(specs.previous_owners)
          : null,
      fuel_type: fuel || null,
      transmission: transmission || null,
    };
    for (const [key, value] of Object.entries(prices))
      if (
        value !== "" &&
        Number(value) !== vehicle[key as keyof DealershipVehicle]
      )
        Object.assign(input, { [key]: Number(value) });
    if (currency !== vehicle.price_currency) input.price_currency = currency;
    if (estimated !== vehicle.cost_is_estimated)
      input.cost_is_estimated = estimated;
    if (provider !== (vehicle.financing_provider ?? ""))
      input.financing_provider = provider;
    if (reason.trim()) input.status_reason = reason.trim();
    setBusy(true);
    setError(null);
    try {
      for (const [kind, file] of Object.entries(documents))
        await uploadVehicleDocument(vehicle.id, kind, file);
      await onSave(input);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron guardar los datos.",
      );
    } finally {
      setBusy(false);
    }
  }
  const fieldClass = "mt-1 w-full rounded-xl border p-3";
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-navy/40 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Editar vehículo"
        className="max-h-[90dvh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <header className="mb-5 flex justify-between">
          <h2 className="text-xl font-bold text-navy">Editar vehículo</h2>
          <button disabled={busy} onClick={onClose}>
            Cerrar
          </button>
        </header>
        <fieldset disabled={busy} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            {Object.entries(labels).map(([key, label]) => (
              <label key={key} className="text-sm">
                {label}
                <input
                  value={data[key as keyof typeof data]}
                  onChange={(e) =>
                    setData((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                  className={fieldClass}
                />
              </label>
            ))}
            <label className="text-sm">
              Condición
              <select
                value={condition}
                onChange={(e) =>
                  setCondition(e.target.value as typeof condition)
                }
                className={fieldClass}
              >
                <option value="nuevo">Nuevo</option>
                <option value="usado">Usado</option>
              </select>
            </label>
            <label className="text-sm">
              Año
              <NumberInput
                value={year}
                onValueChange={setYear}
                className={fieldClass}
              />
            </label>
            <label className="text-sm">
              Kilometraje
              <NumberInput
                value={mileage}
                onValueChange={setMileage}
                className={fieldClass}
              />
            </label>
            <label className="text-sm">
              Combustible
              <select
                value={fuel}
                onChange={(e) => setFuel(e.target.value as typeof fuel)}
                className={fieldClass}
              >
                <option value="">Sin registrar</option>
                {["gasolina", "diesel", "hibrido", "electrico"].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Transmisión
              <select
                value={transmission}
                onChange={(e) =>
                  setTransmission(e.target.value as typeof transmission)
                }
                className={fieldClass}
              >
                <option value="">Sin registrar</option>
                <option value="automatica">Automática</option>
                <option value="manual">Manual</option>
              </select>
            </label>
          </div>
          <VehicleSpecificationsFields
            value={specs}
            onChange={setSpecs}
            used={condition === "usado"}
            documents={documents}
            existing={vehicle.registration_documents}
            onDocument={(kind, file) =>
              setDocuments((prev) => ({ ...prev, [kind]: file }))
            }
          />
          <h3 className="font-semibold">Precios e impuestos</h3>
          <p className="text-xs text-steel">
            Los cambios de precios y costo requieren permiso de administración y
            motivo.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {Object.entries(priceLabels).map(([key, label]) => (
              <label key={key} className="text-sm">
                {label}
                <NumberInput
                  inputMode="decimal"
                  value={prices[key]}
                  onValueChange={(value) =>
                    setPrices((prev) => ({ ...prev, [key]: value }))
                  }
                  className={fieldClass}
                />
              </label>
            ))}
            <label>
              Moneda
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as typeof currency)}
                className={fieldClass}
              >
                <option value="USD">USD</option>
                <option value="VES">Bolívares</option>
              </select>
            </label>
            <label>
              Financiera
              <input
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className={fieldClass}
              />
            </label>
          </div>
          <label className="block text-sm">
            <input
              type="checkbox"
              checked={estimated}
              onChange={(e) => setEstimated(e.target.checked)}
            />{" "}
            Costo estimado
          </label>
          <label className="block text-sm">
            Motivo del cambio de precios
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
              className={fieldClass}
            />
          </label>
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <button
            onClick={() => void save()}
            className="w-full rounded-full bg-blue p-3 font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Guardando…" : "Guardar cambios"}
          </button>
        </fieldset>
      </section>
    </div>
  );
}
