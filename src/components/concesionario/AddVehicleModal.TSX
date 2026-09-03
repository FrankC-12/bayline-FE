"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { BRAND_MODELS, STATUS_OPTIONS, VEHICLE_COLORS } from "@/lib/vehicle-catalog-dealership";
import { formatMoneyInput } from "@/lib/format";
import { getLatestExchangeRates, type CreateVehicleInput } from "@/lib/api/concesionario";
import CreatableSelect from "./CreatableSelect";
import { useModuleAccess } from "@/hooks/useModuleAccess";

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
  const { canEdit } = useModuleAccess("concesionario");
  const [status, setStatus] = useState("en_transito");
  const [brandModels, setBrandModels] = useState<Record<string, string[]>>(BRAND_MODELS);
  const [years, setYears] = useState(YEARS);
  const [colors, setColors] = useState(VEHICLE_COLORS);
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
  const [priceCurrency, setPriceCurrency] = useState<"USD" | "VES">("USD");
  const [ivaPercentage, setIvaPercentage] = useState("16");
  const [igtfPercentage, setIgtfPercentage] = useState("3");
  const [luxuryTaxPercentage, setLuxuryTaxPercentage] = useState("0");
  const [bcvRate, setBcvRate] = useState<number | null>(null);
  const [bcvDate, setBcvDate] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const models = brandModels[brand] ?? [];

  useEffect(() => {
    try {
      const saved = localStorage.getItem("bayline.vehicleOptions");
      if (!saved) return;
      const parsed = JSON.parse(saved) as { brandModels?: Record<string, string[]>; years?: number[]; colors?: string[] };
      if (parsed.brandModels) setBrandModels(parsed.brandModels);
      if (parsed.years) setYears(parsed.years);
      if (parsed.colors) setColors(parsed.colors);
    } catch {
      // Keep the built-in catalog if local preferences are unavailable.
    }
  }, []);

  function saveOptions(nextBrandModels = brandModels, nextYears = years, nextColors = colors) {
    localStorage.setItem("bayline.vehicleOptions", JSON.stringify({ brandModels: nextBrandModels, years: nextYears, colors: nextColors }));
  }

  function addBrand(value: string) {
    const normalized = value.trim();
    if (!normalized) return;
    const existing = Object.keys(brandModels).find((item) => item.toLowerCase() === normalized.toLowerCase());
    const selected = existing ?? normalized;
    const next = existing ? brandModels : { ...brandModels, [selected]: [] };
    setBrandModels(next);
    setBrand(selected);
    setModel(next[selected]?.[0] ?? "");
    saveOptions(next);
  }

  function addModel(value: string) {
    const normalized = value.trim();
    if (!normalized) return;
    const current = brandModels[brand] ?? [];
    const existing = current.find((item) => item.toLowerCase() === normalized.toLowerCase());
    const selected = existing ?? normalized;
    const next = existing ? brandModels : { ...brandModels, [brand]: [...current, selected] };
    setBrandModels(next);
    setModel(selected);
    saveOptions(next);
  }

  function addYear(value: string) {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1980 || parsed > 2100) {
      setError("El año debe estar entre 1980 y 2100.");
      return;
    }
    const next = Array.from(new Set([...years, parsed])).sort((a, b) => b - a);
    setYears(next);
    setYear(parsed);
    saveOptions(brandModels, next);
  }

  function addColor(value: string) {
    const normalized = value.trim();
    if (!normalized) return;
    const existing = colors.find((item) => item.toLowerCase() === normalized.toLowerCase());
    const selected = existing ?? normalized;
    const next = existing ? colors : [...colors, selected].sort();
    setColors(next);
    setColor(selected);
    saveOptions(brandModels, years, next);
  }

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
    setModel(brandModels["Toyota"]?.[0] ?? "");
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
    setPriceCurrency("USD");
    setIvaPercentage("16");
    setIgtfPercentage("3");
    setLuxuryTaxPercentage("0");
    setError(null);
    void getLatestExchangeRates().then((rates) => {
      const usd = rates.find((rate) => rate.currency === "USD");
      if (usd) { setBcvRate(usd.rate_ves); setBcvDate(usd.value_date); }
    }).catch(() => undefined);
    // Reset only when the modal opens; option changes must not reset the form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const cash = Number(priceCash) || 0;
  const ivaAmount = cash * (Number(ivaPercentage) || 0) / 100;
  const igtfAmount = priceCurrency === "USD" ? cash * (Number(igtfPercentage) || 0) / 100 : 0;
  const luxuryAmount = cash * (Number(luxuryTaxPercentage) || 0) / 100;
  const cashTotal = cash + ivaAmount + igtfAmount + luxuryAmount;

  async function handleSubmit() {
    if (!brand || !model || !vin.trim() || !sku.trim() || !(Number(costPrice) > 0)) {
      setError("Marca, modelo, VIN, SKU y costo de adquisición son obligatorios.");
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
        price_cash: Number(priceCash) || 0,
        price_financed: Number(priceFinanced) || 0,
        cost_price: Number(costPrice),
        price_currency: priceCurrency,
        iva_percentage: Number(ivaPercentage) || 0,
        igtf_percentage: Number(igtfPercentage) || 0,
        luxury_tax_percentage: Number(luxuryTaxPercentage) || 0,
        financing_provider: "troyano",
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
            <CreatableSelect label="Marca" required canAdd={canEdit} value={brand} options={Object.keys(brandModels)} onChange={setBrand} onAdd={addBrand} />
            <CreatableSelect label="Modelo" required canAdd={canEdit} value={model} options={models} onChange={setModel} onAdd={addModel} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <CreatableSelect label="Año" required canAdd={canEdit} value={year} options={years} onChange={setYear} onAdd={addYear} inputMode="numeric" />
            <CreatableSelect label="Color" canAdd={canEdit} value={color} options={["", ...colors]} onChange={setColor} onAdd={addColor} />
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
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <label className="block text-sm font-medium text-navy">Precio al contado (PVP) *</label>
                <div className="flex rounded-full bg-ash p-0.5 text-xs">
                  {(["USD", "VES"] as const).map((currency) => <button type="button" key={currency} onClick={() => setPriceCurrency(currency)} className={`rounded-full px-2.5 py-1 ${priceCurrency === currency ? "bg-blue text-white" : "text-steel"}`}>{currency === "VES" ? "Bs." : "$"}</button>)}
                </div>
              </div>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-steel">
                  {priceCurrency === "USD" ? "$" : "Bs."}
                </span>
                <input
                  inputMode="decimal"
                  value={priceCash}
                  onChange={(e) => setPriceCash(formatMoneyInput(e.target.value))}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-navy/15 py-2.5 pl-12 pr-4 text-sm outline-none focus:border-blue"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Precio financiado ({priceCurrency === "USD" ? "USD" : "Bs."}) *</label>
            <div className="relative max-w-xs">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-steel">
                {priceCurrency === "USD" ? "$" : "Bs."}
              </span>
              <input
                inputMode="decimal"
                value={priceFinanced}
                onChange={(e) => setPriceFinanced(formatMoneyInput(e.target.value))}
                placeholder="0.00"
                className="w-full rounded-xl border border-navy/15 py-2.5 pl-12 pr-4 text-sm outline-none focus:border-blue"
              />
            </div>
          </div>
          <p className="-mt-3 text-xs text-steel">Preparado para Troyano; la referencia externa se asignará cuando se conecte su API.</p>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Costo de adquisición *</label>
            <div className="relative max-w-xs">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-steel">
                {priceCurrency === "USD" ? "$" : "Bs."}
              </span>
              <input
                inputMode="decimal"
                value={costPrice}
                onChange={(e) => setCostPrice(formatMoneyInput(e.target.value))}
                placeholder="0.00"
                className="w-full rounded-xl border border-navy/15 py-2.5 pl-12 pr-4 text-sm outline-none focus:border-blue"
              />
            </div>
            <p className="mt-1.5 text-xs text-steel">Lo que pagó el concesionario por el vehículo — se usa para calcular la rentabilidad, no se muestra al cliente.</p>
          </div>

          <div className="rounded-2xl border border-navy/10 bg-ash/60 p-4">
            <div className="mb-4 flex items-start justify-between gap-3"><div><h3 className="font-semibold text-navy">Impuestos del PVP</h3><p className="text-xs text-steel">IGTF se aplica automáticamente cuando la moneda es USD.</p></div>{bcvRate && <span className="text-right text-xs text-steel">BCV: Bs. {bcvRate.toFixed(4)}<br />{bcvDate && new Date(`${bcvDate}T12:00:00`).toLocaleDateString("es-VE")}</span>}</div>
            <div className="grid grid-cols-3 gap-3">
              <label className="text-xs text-steel">IVA %<input inputMode="decimal" value={ivaPercentage} onChange={(e) => setIvaPercentage(formatMoneyInput(e.target.value))} className="mt-1 w-full rounded-lg border border-navy/15 bg-white px-3 py-2 text-sm text-navy" /></label>
              <label className="text-xs text-steel">IGTF %<input inputMode="decimal" disabled={priceCurrency !== "USD"} value={igtfPercentage} onChange={(e) => setIgtfPercentage(formatMoneyInput(e.target.value))} className="mt-1 w-full rounded-lg border border-navy/15 bg-white px-3 py-2 text-sm text-navy disabled:opacity-50" /></label>
              <label className="text-xs text-steel">Lujo % (manual)<input inputMode="decimal" value={luxuryTaxPercentage} onChange={(e) => setLuxuryTaxPercentage(formatMoneyInput(e.target.value))} className="mt-1 w-full rounded-lg border border-navy/15 bg-white px-3 py-2 text-sm text-navy" /></label>
            </div>
            <dl className="mt-4 space-y-1 border-t border-navy/10 pt-3 text-sm"><div className="flex justify-between"><dt>IVA</dt><dd>{ivaAmount.toFixed(2)}</dd></div>{priceCurrency === "USD" && <div className="flex justify-between"><dt>IGTF</dt><dd>{igtfAmount.toFixed(2)}</dd></div>}<div className="flex justify-between"><dt>Impuesto al lujo</dt><dd>{luxuryAmount.toFixed(2)}</dd></div><div className="flex justify-between pt-1 font-bold text-navy"><dt>Total</dt><dd>{priceCurrency === "USD" ? "$" : "Bs."} {cashTotal.toFixed(2)}</dd></div>{priceCurrency === "USD" && bcvRate && <div className="flex justify-between text-xs text-steel"><dt>Equivalente BCV</dt><dd>Bs. {(cashTotal * bcvRate).toFixed(2)}</dd></div>}</dl>
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
