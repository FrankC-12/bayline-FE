import type { VehicleBrandOption } from "@/types/vehicleCatalog";

interface BrandModelSelectProps {
  brands: VehicleBrandOption[];
  brand: string;
  model: string;
  onBrandChange: (brand: string) => void;
  onModelChange: (model: string) => void;
  modelRequired?: boolean;
  disabled?: boolean;
  /** Smaller labels/padding, for tight grids (e.g. a repeatable vehicle row). */
  compact?: boolean;
  /** Highlight the field in red with an inline message — e.g. "Selecciona
   * la marca." — set after a failed submit, cleared as soon as the field
   * is filled. */
  brandError?: string;
  modelError?: string;
}

/** Cascading Marca/Modelo selects sourced from the holding-wide vehicle
 * catalog (Ajustes → Marcas y Modelos) — strict, no free text. Renders as a
 * fragment so callers keep control of the surrounding grid layout. */
export default function BrandModelSelect({
  brands,
  brand,
  model,
  onBrandChange,
  onModelChange,
  modelRequired = true,
  disabled = false,
  compact = false,
  brandError,
  modelError,
}: BrandModelSelectProps) {
  const selectedBrand = brands.find((b) => b.name === brand);
  const models = selectedBrand?.models ?? [];

  const labelClass = compact
    ? "mb-1 block text-xs font-medium text-navy"
    : "mb-1.5 block text-sm font-medium text-navy";
  const baseSelectClass = compact
    ? "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20 disabled:bg-ash disabled:text-steel"
    : "w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20 disabled:bg-ash disabled:text-steel";
  const borderClass = (hasError?: string) => (hasError ? "border-red-400" : "border-navy/15");

  function handleBrandChange(next: string) {
    onBrandChange(next);
    onModelChange("");
  }

  return (
    <>
      <div>
        <label className={labelClass}>Marca *</label>
        <select
          value={brand}
          onChange={(e) => handleBrandChange(e.target.value)}
          disabled={disabled}
          className={`${baseSelectClass} ${borderClass(brandError)}`}
        >
          <option value="">Selecciona...</option>
          {brands.map((b) => (
            <option key={b.id} value={b.name}>
              {b.name}
            </option>
          ))}
        </select>
        {brandError && <p className="mt-1 text-xs text-red-600">{brandError}</p>}
      </div>
      <div>
        <label className={labelClass}>Modelo{modelRequired ? " *" : " (opcional)"}</label>
        <select
          value={model}
          onChange={(e) => onModelChange(e.target.value)}
          disabled={disabled || !brand || models.length === 0}
          className={`${baseSelectClass} ${borderClass(modelError)}`}
        >
          <option value="">{brand && models.length === 0 ? "Sin modelos cargados" : "Selecciona..."}</option>
          {models.map((m) => (
            <option key={m.id} value={m.name}>
              {m.name}
            </option>
          ))}
        </select>
        {modelError && <p className="mt-1 text-xs text-red-600">{modelError}</p>}
      </div>
    </>
  );
}
