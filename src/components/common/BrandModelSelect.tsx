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
}: BrandModelSelectProps) {
  const selectedBrand = brands.find((b) => b.name === brand);
  const models = selectedBrand?.models ?? [];

  const labelClass = compact
    ? "mb-1 block text-xs font-medium text-navy"
    : "mb-1.5 block text-sm font-medium text-navy";
  const selectClass = compact
    ? "w-full rounded-lg border border-navy/15 px-3 py-2 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20 disabled:bg-ash disabled:text-steel"
    : "w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20 disabled:bg-ash disabled:text-steel";

  function handleBrandChange(next: string) {
    onBrandChange(next);
    onModelChange("");
  }

  return (
    <>
      <div>
        <label className={labelClass}>Marca</label>
        <select
          value={brand}
          onChange={(e) => handleBrandChange(e.target.value)}
          disabled={disabled}
          className={selectClass}
        >
          <option value="">Selecciona...</option>
          {brands.map((b) => (
            <option key={b.id} value={b.name}>
              {b.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass}>Modelo{modelRequired ? "" : " (opcional)"}</label>
        <select
          value={model}
          onChange={(e) => onModelChange(e.target.value)}
          disabled={disabled || !brand || models.length === 0}
          className={selectClass}
        >
          <option value="">{brand && models.length === 0 ? "Sin modelos cargados" : "Selecciona..."}</option>
          {models.map((m) => (
            <option key={m.id} value={m.name}>
              {m.name}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
