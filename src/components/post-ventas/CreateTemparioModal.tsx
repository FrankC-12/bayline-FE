"use client";

import { formatMoney, formatCount } from "@/lib/format";
import { NumberInput } from "@/components/ui/NumberInput";

import { useEffect, useMemo, useState } from "react";
import { X, Loader2, Plus, Search } from "lucide-react";
import { CATEGORY_OPTIONS } from "@/lib/temparios-categories";
import { quoteTempario, type TemparioQuote } from "@/lib/api/temparioPricing";
import { useParts } from "@/hooks/useParts";
import { useVehicleCatalog } from "@/hooks/useVehicleCatalog";
import type { CreateTemparioInput } from "@/lib/api/temparios";
import type { Tempario, TemparioCategory } from "@/types/tempario";

interface PartDraft {
  partId: string;
  search: string;
  quantity: string;
  unitCost: string;
}

interface CreateTemparioModalProps {
  open: boolean;
  onClose: () => void;
  filialId: string;
  hourlyRate: number;
  ivaPercentage?: number;
  onSubmit: (input: CreateTemparioInput) => Promise<void>;
  editingTempario?: Tempario | null;
}

function emptyPart(): PartDraft {
  return { partId: "", search: "", quantity: "1", unitCost: "0" };
}

export default function CreateTemparioModal({
  open,
  onClose,
  filialId,
  hourlyRate,
  ivaPercentage = 16,
  onSubmit,
  editingTempario,
}: CreateTemparioModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<TemparioCategory>(
    "mantenimiento_preventivo",
  );
  const [sequenceNumber, setSequenceNumber] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("1.0");
  const [yearFrom, setYearFrom] = useState("2015");
  const [yearTo, setYearTo] = useState(String(new Date().getFullYear()));
  const [selectedVehicles, setSelectedVehicles] = useState<Set<string>>(
    new Set(),
  );
  const [toolInput, setToolInput] = useState("");
  const [tools, setTools] = useState<string[]>([]);
  const [warrantyTouched, setWarrantyTouched] = useState(false);
  const [warrantyMode, setWarrantyMode] = useState<
    "standard" | "custom" | "none"
  >("standard");
  const [warrantyDays, setWarrantyDays] = useState("");
  const [warrantyKm, setWarrantyKm] = useState("");
  const [requiresParts, setRequiresParts] = useState(true);
  const [parts, setParts] = useState<PartDraft[]>([emptyPart()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentPrefix =
    CATEGORY_OPTIONS.find((c) => c.value === category)?.prefix ?? "";
  const { parts: catalogParts } = useParts(filialId);
  const { brands: vehicleBrands } = useVehicleCatalog(filialId);

  useEffect(() => {
    if (!open) return;
    if (editingTempario) {
      setName(editingTempario.name);
      setCategory(editingTempario.category);
      setSequenceNumber(editingTempario.code.split("-")[1] ?? "");
      setEstimatedHours(String(editingTempario.estimated_hours));
      setYearFrom(
        editingTempario.year_from ? String(editingTempario.year_from) : "",
      );
      setYearTo(editingTempario.year_to ? String(editingTempario.year_to) : "");
      setSelectedVehicles(
        new Set(
          editingTempario.compatible_vehicles.map(
            (v) => `${v.brand}|${v.model}`,
          ),
        ),
      );
      setTools(editingTempario.tools);
      setRequiresParts(editingTempario.requires_parts);
      setWarrantyMode(editingTempario.warranty_mode ?? "standard");
      setWarrantyDays(String(editingTempario.warranty_days ?? ""));
      setWarrantyKm(String(editingTempario.warranty_km ?? ""));
      setParts(
        editingTempario.parts.length
          ? editingTempario.parts.map((p) => ({
              partId: p.part_id ?? "",
              search: p.name,
              quantity: String(p.quantity),
              unitCost: String(p.unit_cost),
            }))
          : [emptyPart()],
      );
    } else {
      setName("");
      setCategory("mantenimiento_preventivo");
      setSequenceNumber("");
      setEstimatedHours("1.0");
      setYearFrom("");
      setYearTo("");
      setSelectedVehicles(new Set());
      setTools([]);
      setRequiresParts(true);
      setWarrantyMode("standard");
      setWarrantyDays("");
      setWarrantyKm("");
      setParts([emptyPart()]);
    }
    setWarrantyTouched(false);
    setError(null);
  }, [open, editingTempario]);

  function toggleVehicle(brand: string, model: string) {
    const key = `${brand}|${model}`;
    setSelectedVehicles((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const allVehicleKeys = useMemo(
    () =>
      vehicleBrands.flatMap((b) => b.models.map((m) => `${b.name}|${m.name}`)),
    [vehicleBrands],
  );
  const allVehiclesSelected =
    allVehicleKeys.length > 0 &&
    allVehicleKeys.every((key) => selectedVehicles.has(key));

  function toggleAllVehicles() {
    setSelectedVehicles(
      allVehiclesSelected ? new Set() : new Set(allVehicleKeys),
    );
  }

  function brandKeys(brandName: string): string[] {
    const brand = vehicleBrands.find((b) => b.name === brandName);
    return brand ? brand.models.map((m) => `${brandName}|${m.name}`) : [];
  }

  function toggleAllForBrand(brandName: string) {
    const keys = brandKeys(brandName);
    const allBrandSelected =
      keys.length > 0 && keys.every((key) => selectedVehicles.has(key));
    setSelectedVehicles((prev) => {
      const next = new Set(prev);
      keys.forEach((key) =>
        allBrandSelected ? next.delete(key) : next.add(key),
      );
      return next;
    });
  }

  function addTool() {
    if (!toolInput.trim()) return;
    setTools((prev) => [...prev, toolInput.trim()]);
    setToolInput("");
  }

  function removeTool(index: number) {
    setTools((prev) => prev.filter((_, i) => i !== index));
  }

  function updatePart(index: number, patch: Partial<PartDraft>) {
    setParts((prev) =>
      prev.map((p, i) => (i === index ? { ...p, ...patch } : p)),
    );
  }

  function addPart() {
    setParts((prev) => [...prev, emptyPart()]);
  }

  function removePart(index: number) {
    setParts((prev) =>
      prev.length > 1 ? prev.filter((_, i) => i !== index) : prev,
    );
  }

  const validParts = useMemo(
    () =>
      requiresParts
        ? parts
            .filter((p) => p.search.trim())
            .map((p) => ({
              part_id: p.partId || null,
              name: p.search.trim(),
              quantity: Number(p.quantity),
              unit_cost: Number(p.unitCost) || 0,
            }))
        : [],
    [parts, requiresParts],
  );

  const [quoteState, setQuoteState] = useState<{
    key: string;
    quote: TemparioQuote;
  } | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const quoteInput = {
    filial_id: filialId,
    estimated_hours: Number(estimatedHours) || 0,
    parts: validParts,
  };
  const quoteKey = JSON.stringify(quoteInput);
  const currentQuote = quoteState?.key === quoteKey ? quoteState.quote : null;
  useEffect(() => {
    let active = true;
    if (!open) {
      setQuoteState(null);
      return;
    }
    setQuoteError(null);
    const input = JSON.parse(quoteKey) as Parameters<typeof quoteTempario>[0];
    if (
      !Number.isFinite(input.estimated_hours) ||
      input.estimated_hours < 0 ||
      input.parts.some(
        (part) => !Number.isInteger(part.quantity) || part.quantity < 1,
      )
    )
      return;
    const timer = setTimeout(() => {
      quoteTempario(input)
        .then((quote) => {
          if (active) setQuoteState({ key: quoteKey, quote });
        })
        .catch((err) => {
          if (active)
            setQuoteError(
              err instanceof Error
                ? err.message
                : "No se pudo cotizar el tempario.",
            );
        });
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [open, quoteKey]);
  const partsCost = currentQuote?.parts_cost ?? 0;
  const partsMargin = currentQuote?.parts_margin ?? 0;
  const laborCost = currentQuote?.labor_cost ?? 0;
  const subtotal = currentQuote?.total_price ?? 0;
  const ivaAmount = currentQuote?.iva_amount ?? 0;
  const totalWithIva = currentQuote?.total_with_iva ?? 0;

  async function handleSubmit() {
    if (!name.trim()) {
      setError("El nombre del servicio es obligatorio.");
      return;
    }
    if (submitting || !currentQuote) return;
    if (
      warrantyMode === "custom" &&
      !(Number(warrantyDays) > 0 || Number(warrantyKm) > 0)
    ) {
      setError("Define días o kilómetros para la garantía personalizada.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const compatible_vehicles = Array.from(selectedVehicles).map((key) => {
        const [brand, model] = key.split("|");
        return { brand, model };
      });

      await onSubmit({
        filial_id: filialId,
        category,
        sequence_number: sequenceNumber ? Number(sequenceNumber) : null,
        name: name.trim(),
        estimated_hours: Number(estimatedHours) || 0,
        year_from: yearFrom ? Number(yearFrom) : null,
        year_to: yearTo ? Number(yearTo) : null,
        compatible_vehicles,
        tools,
        requires_parts: requiresParts,
        ...(!editingTempario || warrantyTouched
          ? {
              warranty_mode: warrantyMode,
              warranty_days:
                warrantyMode === "custom" && warrantyDays
                  ? Number(warrantyDays)
                  : null,
              warranty_km:
                warrantyMode === "custom" && warrantyKm
                  ? Number(warrantyKm)
                  : null,
              labor_warranty_policy_id: null,
              parts_warranty_policy_id: null,
            }
          : {}),
        parts: validParts,
      });
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo guardar el tempario.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-navy/40" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tempario-form-title"
        className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-navy/10 px-6 py-4">
          <div>
            <h2
              id="tempario-form-title"
              className="font-display text-xl font-bold text-navy"
            >
              {editingTempario ? "Editar Tempario" : "Nuevo Tempario"}
            </h2>
            <p className="text-xs text-steel">
              El código se genera con la sigla de la categoría · el precio se
              calcula automáticamente
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-lg p-2 text-steel hover:bg-ash hover:text-navy"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav
          aria-label="Secciones del tempario"
          className="flex shrink-0 gap-2 overflow-x-auto border-b border-navy/10 px-6 py-3"
        >
          {[
            { id: "datos", label: "Datos" },
            { id: "compatibilidad", label: "Compatibilidad" },
            { id: "herramientas", label: "Herramientas" },
            { id: "repuestos", label: "Repuestos" },
            { id: "garantia", label: "Garantía" },
            { id: "precio", label: "Precio" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() =>
                document
                  .getElementById(`tempario-${item.id}`)
                  ?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
              className="whitespace-nowrap rounded-full bg-ash px-3 py-1.5 text-xs text-navy"
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          <div id="tempario-datos">
            <label className="mb-1.5 block text-sm font-medium text-navy">
              Nombre del servicio
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Cambio de aceite y filtro"
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">
                Categoría
              </label>
              <select
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as TemparioCategory)
                }
                className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">
                Código del servicio
              </label>
              <div className="flex overflow-hidden rounded-xl border border-navy/15">
                <span className="flex items-center bg-ash px-3 text-sm font-mono text-blue">
                  {currentPrefix}-
                </span>
                <input
                  value={sequenceNumber}
                  onChange={(e) =>
                    setSequenceNumber(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="Automático"
                  className="w-full px-3 py-2.5 text-sm outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">
              Horas estimadas
            </label>
            <NumberInput
              min="0"
              step="0.1"
              value={estimatedHours}
              onValueChange={(value) => setEstimatedHours(value)}
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
            />
          </div>

          <div id="tempario-compatibilidad">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-mono text-[11px] uppercase tracking-widest text-blue">
                Vehículos compatibles
              </p>
              {allVehicleKeys.length > 0 && (
                <button
                  type="button"
                  onClick={toggleAllVehicles}
                  className="text-xs font-semibold text-blue hover:underline"
                >
                  {allVehiclesSelected ? "Quitar todos" : "Seleccionar todos"}
                </button>
              )}
            </div>
            <div className="space-y-4 rounded-xl border border-navy/10 p-4">
              {vehicleBrands.length === 0 && (
                <p className="text-xs text-steel">
                  No hay marcas cargadas todavía — agrégalas en Ajustes → Marcas
                  y Modelos.
                </p>
              )}
              {vehicleBrands.map((b) => {
                const brandModelKeys = brandKeys(b.name);
                const brandAllSelected =
                  brandModelKeys.length > 0 &&
                  brandModelKeys.every((key) => selectedVehicles.has(key));
                return (
                  <div key={b.id}>
                    <div className="mb-2 flex items-center gap-2">
                      <p className="font-semibold text-navy">{b.name}</p>
                      {b.models.length > 0 && (
                        <button
                          type="button"
                          onClick={() => toggleAllForBrand(b.name)}
                          className="text-xs font-medium text-blue hover:underline"
                        >
                          {brandAllSelected
                            ? "Quitar todos"
                            : "Seleccionar todos"}
                        </button>
                      )}
                    </div>
                    {b.models.length === 0 ? (
                      <p className="text-xs text-steel">
                        Esta marca todavía no tiene modelos cargados.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {b.models.map((m) => {
                          const key = `${b.name}|${m.name}`;
                          const checked = selectedVehicles.has(key);
                          return (
                            <label
                              key={m.id}
                              className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                                checked
                                  ? "border-blue bg-blue-light text-blue"
                                  : "border-navy/15 text-navy"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleVehicle(b.name, m.name)}
                                className="h-3.5 w-3.5"
                              />
                              {m.name}
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">
                Año compatible desde
              </label>
              <input
                type="number"
                min="1900"
                max="2100"
                step="1"
                placeholder="Sin límite"
                value={yearFrom}
                onChange={(e) => setYearFrom(e.target.value)}
                className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">
                Hasta
              </label>
              <input
                type="number"
                min="1900"
                max="2100"
                step="1"
                placeholder="Sin límite"
                value={yearTo}
                onChange={(e) => setYearTo(e.target.value)}
                className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
              />
            </div>
          </div>

          <div id="tempario-herramientas">
            <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-blue">
              Herramientas a utilizar
            </p>
            <div className="flex gap-2">
              <input
                value={toolInput}
                onChange={(e) => setToolInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTool();
                  }
                }}
                placeholder="Ej. Llave de filtro — Enter para agregar"
                className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
              />
              <button
                type="button"
                onClick={addTool}
                className="shrink-0 rounded-xl border border-blue px-4 py-2.5 text-sm font-semibold text-blue transition hover:bg-blue-light"
              >
                Agregar
              </button>
            </div>
            {tools.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {tools.map((tool, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1.5 rounded-full bg-ash px-3 py-1 text-xs text-navy"
                  >
                    {tool}
                    <button
                      type="button"
                      onClick={() => removeTool(i)}
                      className="text-steel hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div id="tempario-repuestos">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-mono text-[11px] uppercase tracking-widest text-blue">
                Repuestos a utilizar
              </p>
              <label className="flex items-center gap-2 text-sm text-steel">
                <input
                  type="checkbox"
                  checked={!requiresParts}
                  onChange={(e) => setRequiresParts(!e.target.checked)}
                  className="h-3.5 w-3.5"
                />
                Este servicio no requiere repuestos
              </label>
            </div>

            {requiresParts && (
              <div className="space-y-2 rounded-xl border border-navy/10 p-3">
                <div className="grid grid-cols-[minmax(0,1fr)_64px_96px_80px_36px] gap-2 text-[10px] font-semibold uppercase tracking-wide text-steel">
                  <span>Repuesto</span>
                  <span>Cantidad</span>
                  <span>Costo u.</span>
                  <span className="text-right">Costo total</span>
                  <span />
                </div>
                {parts.map((p, i) => {
                  const pricedPart = currentQuote?.parts?.find((item) =>
                    p.partId
                      ? item.part_id === p.partId &&
                        item.quantity === Number(p.quantity)
                      : item.name === p.search.trim(),
                  );
                  const results =
                    p.search && !p.partId
                      ? catalogParts
                          .filter(
                            (cp) =>
                              cp.code
                                .toLowerCase()
                                .includes(p.search.toLowerCase()) ||
                              cp.name
                                .toLowerCase()
                                .includes(p.search.toLowerCase()),
                          )
                          .slice(0, 6)
                      : [];
                  return (
                    <div key={i}>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="relative min-w-32 flex-1">
                          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-steel" />
                          <input
                            value={p.search}
                            onChange={(e) =>
                              updatePart(i, {
                                search: e.target.value,
                                partId: "",
                              })
                            }
                            placeholder="Buscar en el catálogo por código o nombre..."
                            className="w-full rounded-lg border border-navy/15 py-2 pl-8 pr-3 text-sm outline-none focus:border-blue"
                          />
                        </div>
                        <div className="flex items-center gap-2 rounded-lg border border-navy/10 px-2 py-1">
                          <button
                            type="button"
                            disabled={Number(p.quantity) <= 1}
                            aria-label={`Reducir cantidad de ${p.search || "repuesto"}`}
                            onClick={() =>
                              updatePart(i, {
                                quantity: String(
                                  Math.max(1, Number(p.quantity) - 1),
                                ),
                              })
                            }
                            className="px-1 py-1 disabled:opacity-30"
                          >
                            −
                          </button>
                          <output
                            className="min-w-6 text-center text-sm"
                            aria-label="Cantidad requerida"
                          >
                            {p.quantity}
                          </output>
                          <button
                            type="button"
                            aria-label={`Aumentar cantidad de ${p.search || "repuesto"}`}
                            onClick={() =>
                              updatePart(i, {
                                quantity: String(Number(p.quantity) + 1),
                              })
                            }
                            className="px-1 py-1"
                          >
                            +
                          </button>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-steel">$</span>
                          <span
                            className="inline-block min-w-20 rounded-lg bg-slate-50 px-2 py-2 text-right text-sm text-navy"
                            title="Costo calculado desde los lotes; se administra en almacén"
                          >
                            {formatMoney(
                              pricedPart?.unit_cost ?? Number(p.unitCost) ?? 0,
                            )}
                          </span>
                        </div>
                        <span className="w-20 shrink-0 text-right text-sm font-medium text-navy">
                          {p.partId
                            ? pricedPart
                              ? `$${formatMoney(pricedPart.subtotal)}`
                              : "…"
                            : `$${formatMoney((Number(p.quantity) || 0) * (Number(p.unitCost) || 0))}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => removePart(i)}
                          className="rounded-lg border border-navy/15 p-2 text-red-500 hover:bg-red-50"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {results.length > 0 && (
                        <div className="mt-1 divide-y divide-navy/5 rounded-lg border border-navy/10 bg-white shadow-sm">
                          {results.map((cp) => (
                            <button
                              key={cp.id}
                              type="button"
                              onClick={() =>
                                updatePart(i, {
                                  partId: cp.id,
                                  search: `${cp.code} · ${cp.name}`,
                                  // The real cost, never reference_price
                                  // (that's already cost × margin) — a
                                  // tempario applies its own margin on top.
                                  unitCost: String(cp.latest_cost ?? 0),
                                })
                              }
                              className="block w-full px-3 py-1.5 text-left text-xs hover:bg-ash"
                            >
                              <span className="font-mono text-blue">
                                {cp.code}
                              </span>{" "}
                              <span className="text-navy">{cp.name}</span>{" "}
                              <span className="text-steel">
                                · costo $
                                {(cp.latest_cost == null
                                  ? undefined
                                  : formatMoney(cp.latest_cost, 2)) ??
                                  "Sin costo"}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={addPart}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-navy/20 py-2 text-sm font-semibold text-blue hover:bg-blue-light"
                >
                  <Plus className="h-4 w-4" />
                  Agregar repuesto
                </button>
              </div>
            )}
          </div>

          <fieldset
            id="tempario-garantia"
            className="space-y-3 rounded-xl border border-navy/10 p-4"
          >
            <legend className="font-mono text-xs uppercase tracking-widest text-blue">
              Garantía
            </legend>
            {editingTempario?.legacy_warranty_label && !warrantyTouched && (
              <p className="rounded-xl bg-ash p-3 text-xs text-steel">
                Garantía actual: {editingTempario.legacy_warranty_label}. Se
                conservará hasta que elijas una nueva modalidad.
              </p>
            )}
            {(
              [
                {
                  mode: "standard",
                  label: "Estándar del taller",
                  help: "Se ajusta en Ajustes › Garantías",
                },
                {
                  mode: "custom",
                  label: "Personalizada",
                  help: "Días y kilómetros propios para este servicio",
                },
                {
                  mode: "none",
                  label: "Sin garantía",
                  help: "Para diagnósticos, lavados y otros servicios sin cobertura",
                },
              ] as const
            ).map((option) => (
              <label
                key={option.mode}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${warrantyMode === option.mode ? "border-blue bg-blue-light/30" : "border-navy/15"}`}
              >
                <input
                  type="radio"
                  name="warranty"
                  checked={
                    warrantyMode === option.mode &&
                    (!editingTempario?.legacy_warranty_label || warrantyTouched)
                  }
                  onChange={() => {
                    setWarrantyMode(option.mode);
                    setWarrantyTouched(true);
                  }}
                />
                <span className="text-sm font-semibold">
                  {option.label}
                  <span className="mt-1 block text-xs font-normal text-steel">
                    {option.help}
                  </span>
                </span>
              </label>
            ))}
            {warrantyMode === "custom" && (
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm">
                  Días
                  <NumberInput
                    min={0}
                    value={warrantyDays}
                    onValueChange={(value) => {
                      setWarrantyDays(value);
                      setWarrantyTouched(true);
                    }}
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                  />
                </label>
                <label className="text-sm">
                  Kilómetros
                  <NumberInput
                    min={0}
                    value={warrantyKm}
                    onValueChange={(value) => {
                      setWarrantyKm(value);
                      setWarrantyTouched(true);
                    }}
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                  />
                </label>
              </div>
            )}
            <p className="text-xs text-steel">
              Cubre mano de obra y repuestos instalados; vence lo que ocurra
              primero. Las órdenes cerradas conservan su garantía.
            </p>
          </fieldset>
          <div
            id="tempario-precio"
            className="rounded-xl border border-blue/20 bg-blue-light/40 p-4"
          >
            <p className="mb-3 font-display font-bold text-navy">
              Precio calculado
            </p>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-steel">
                <span>Costo de repuestos</span>
                <span>${formatMoney(partsCost, 2)}</span>
              </div>
              <div className="flex justify-between border-b border-navy/10 pb-1.5 text-steel">
                <span>Repuestos + 30% (margen)</span>
                <span>${formatMoney(partsMargin, 2)}</span>
              </div>
              <div className="flex justify-between text-steel">
                <span>
                  Mano de obra ({estimatedHours || 0} h × $
                  {formatMoney(currentQuote?.hourly_rate ?? hourlyRate, 2)}/h)
                </span>
                <span>${formatMoney(laborCost, 2)}</span>
              </div>
              <div className="flex justify-between border-t border-navy/10 pt-1.5 text-steel">
                <span>
                  IVA (
                  {formatCount(currentQuote?.iva_percentage ?? ivaPercentage)}%)
                </span>
                <span>${formatMoney(ivaAmount, 2)}</span>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-navy/10 pt-3">
              <span className="font-display font-bold text-navy">Subtotal</span>
              <span className="font-display font-bold text-navy">
                ${formatMoney(subtotal, 2)}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="font-display font-bold text-navy">
                Precio total (con IVA)
              </span>
              <span className="font-display text-xl font-bold text-blue">
                ${formatMoney(totalWithIva, 2)}
              </span>
            </div>
          </div>

          {!currentQuote && (
            <p
              role="status"
              className="rounded-xl bg-blue-light p-3 text-sm text-blue"
            >
              {quoteError ||
                "Calculando el precio con los costos FIFO del almacén…"}
            </p>
          )}
          {currentQuote?.pricing_warnings.map((warning) => (
            <p
              key={warning}
              className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900"
            >
              {warning}
            </p>
          ))}
          {currentQuote?.pricing_notes?.map((note) => (
            <p
              key={note}
              className="rounded-xl bg-slate-50 p-3 text-xs text-steel"
            >
              {note}
            </p>
          ))}
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-navy/10 px-6 py-4">
          <span className="font-mono text-xs text-steel">
            {currentPrefix}-{sequenceNumber || "···"} · $
            {formatMoney(totalWithIva, 2)}
          </span>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-navy/15 px-5 py-2.5 text-sm font-semibold text-navy transition hover:border-navy/40"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !currentQuote}
              className="flex items-center justify-center gap-2 rounded-full bg-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Guardar tempario
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
