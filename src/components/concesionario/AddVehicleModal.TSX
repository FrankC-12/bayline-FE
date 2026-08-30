"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { BRAND_MODELS, STATUS_OPTIONS } from "@/lib/vehicle-catalog-dealership";
import { formatThousands, stripThousands } from "@/lib/format";
import type { CreateVehicleInput } from "@/lib/api/concesionario";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR + 1 - i);

interface AddVehicleModalProps {
  open: boolean;
  onClose: () => void;
  filialId: string;
  onSubmit: (input: CreateVehicleInput) => Promise<unknown>;
}

function suggestSku(brand: string, model: string, year: number, color: string): string {
  const b = brand.slice(0, 3).toUpperCase();
  const m = model.slice(0, 3).toUpperCase();
  const y = String(year).slice(-2);
  const c = color.slice(0, 3).toUpperCase();
  return [b, m, y, c].filter(Boolean).join("-");
}

export default function AddVehicleModal({ open, onClose, filialId, onSubmit }: AddVehicleModalProps) {
  const [status, setStatus] = useState("en_transito");
  const [condition, setCondition] = useState("nuevo");
  const [brand, setBrand] = useState("Toyota");
  const [model, setModel] = useState(BRAND_MODELS["Toyota"][0]);
  const [year, setYear] = useState(CURRENT_YEAR);
  const [color, setColor] = useState("");
  const [fuelType, setFuelType] = useState("gasolina");
  const [transmission, setTransmission] = useState("automatica");
  const [vin, setVin] = useState("");
  const [plate, setPlate] = useState("");
  const [sku, setSku] = useState("");
  const [skuTouched, setSkuTouched] = useState(false);
  const [priceCash, setPriceCash] = useState("");
  const [priceFinanced, setPriceFinanced] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const models = BRAND_MODELS[brand] ?? [];

  useEffect(() => {
    if (!models.includes(model)) setModel(models[0] ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brand]);

  const suggestedSku = useMemo(() => suggestSku(brand, model, year, color), [brand, model, year, color]);

  useEffect(() => {
    if (!skuTouched) setSku(suggestedSku);
  }, [suggestedSku, skuTouched]);

  useEffect(() => {
    if (!open) return;
    setStatus("en_transito");
    setCondition("nuevo");
    setBrand("Toyota");
    setModel(BRAND_MODELS["Toyota"][0]);
    setYear(CURRENT_YEAR);
    setColor("");
    setFuelType("gasolina");
    setTransmission("automatica");
    setVin("");
    setPlate("");
    setSku("");
    setSkuTouched(false);
    setPriceCash("");
    setPriceFinanced("");
    setCostPrice("");
    setError(null);
  }, [open]);

  async function handleSubmit() {
    if (!brand || !model || !vin.trim() || !sku.trim()) {
      setError("Marca, modelo, VIN y SKU son obligatorios.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        filial_id: filialId,
        status,
        condition,
        brand,
        model,
        year,
        color: color || null,
        fuel_type: fuelType || null,
        transmission: transmission || null,
        vin: vin.trim().toUpperCase(),
        plate: plate || null,
        sku: sku.trim().toUpperCase(),
        price_cash: Number(stripThousands(priceCash)) || 0,
        price_financed: Number(stripThousands(priceFinanced)) || 0,
        cost_price: costPrice ? Number(stripThousands(costPrice)) : null,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo agregar el vehículo.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-navy/40" />
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-navy/10 px-6 py-4">
          <div>
            <h2 className="font-display text-xl font-bold text-navy">Agregar Vehículo</h2>
            <p className="text-xs text-steel">Los campos marcados con * son obligatorios</p>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="rounded-lg p-2 text-steel hover:bg-ash hover:text-navy">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">Estado *</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">Tipo *</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
              >
                <option value="nuevo">Nuevo</option>
                <option value="usado">Usado</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">Marca *</label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
              >
                {Object.keys(BRAND_MODELS).map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">Modelo *</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
              >
                {models.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">Año *</label>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">Color</label>
              <input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="Plata"
                className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">Combustible</label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value)}
                className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
              >
                <option value="gasolina">Gasolina</option>
                <option value="diesel">Diesel</option>
                <option value="hibrido">Híbrido</option>
                <option value="electrico">Eléctrico</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">Transmisión</label>
              <select
                value={transmission}
                onChange={(e) => setTransmission(e.target.value)}
                className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
              >
                <option value="automatica">Automática</option>
                <option value="manual">Manual</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">VIN * ({vin.length}/17)</label>
              <input
                value={vin}
                onChange={(e) => setVin(e.target.value.slice(0, 17))}
                placeholder="8AJHA3CD1K0000000"
                className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">Placa (máx. 7)</label>
              <input
                value={plate}
                onChange={(e) => setPlate(e.target.value.slice(0, 7).toUpperCase())}
                placeholder="ABC-123"
                className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">SKU *</label>
              <input
                value={sku}
                onChange={(e) => {
                  setSku(e.target.value);
                  setSkuTouched(true);
                }}
                className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">Precio contado (USD) *</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-steel">
                  $
                </span>
                <input
                  inputMode="numeric"
                  value={priceCash}
                  onChange={(e) => setPriceCash(formatThousands(e.target.value))}
                  placeholder="0"
                  className="w-full rounded-xl border border-navy/15 py-2.5 pl-8 pr-4 text-sm outline-none focus:border-blue"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Precio financiado (USD) *</label>
            <div className="relative max-w-xs">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-steel">
                $
              </span>
              <input
                inputMode="numeric"
                value={priceFinanced}
                onChange={(e) => setPriceFinanced(formatThousands(e.target.value))}
                placeholder="0"
                className="w-full rounded-xl border border-navy/15 py-2.5 pl-8 pr-4 text-sm outline-none focus:border-blue"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Costo de adquisición (opcional)</label>
            <div className="relative max-w-xs">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-steel">
                $
              </span>
              <input
                inputMode="numeric"
                value={costPrice}
                onChange={(e) => setCostPrice(formatThousands(e.target.value))}
                placeholder="0"
                className="w-full rounded-xl border border-navy/15 py-2.5 pl-8 pr-4 text-sm outline-none focus:border-blue"
              />
            </div>
            <p className="mt-1.5 text-xs text-steel">Lo que pagó el concesionario por el vehículo — se usa para calcular la rentabilidad, no se muestra al cliente.</p>
          </div>

          <p className="rounded-xl bg-ash px-4 py-3 text-xs text-steel">
            La carga de fotos del vehículo todavía no está disponible.
          </p>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Agregar vehículo
          </button>
        </div>
      </div>
    </div>
  );
}