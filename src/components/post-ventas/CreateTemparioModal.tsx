"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Loader2, Plus, Search } from "lucide-react";
import { CATEGORY_OPTIONS } from "@/lib/temparios-categories";
import { VEHICLE_CATALOG } from "@/lib/vehicle-catalog";
import { useParts } from "@/hooks/useParts";
import type { CreateTemparioInput } from "@/lib/api/temparios";
import type { Tempario, TemparioCategory } from "@/types/tempario";

const YEARS = Array.from({ length: 2100 - 1990 + 1 }, (_, i) => 1990 + i).reverse();

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
  onSubmit,
  editingTempario,
}: CreateTemparioModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<TemparioCategory>("mantenimiento_preventivo");
  const [sequenceNumber, setSequenceNumber] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("1.0");
  const [yearFrom, setYearFrom] = useState("2015");
  const [yearTo, setYearTo] = useState(String(new Date().getFullYear()));
  const [selectedVehicles, setSelectedVehicles] = useState<Set<string>>(new Set());
  const [toolInput, setToolInput] = useState("");
  const [tools, setTools] = useState<string[]>([]);
  const [requiresParts, setRequiresParts] = useState(true);
  const [parts, setParts] = useState<PartDraft[]>([emptyPart()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentPrefix = CATEGORY_OPTIONS.find((c) => c.value === category)?.prefix ?? "";
  const { parts: catalogParts } = useParts(filialId);

  useEffect(() => {
    if (!open) return;
    if (editingTempario) {
      setName(editingTempario.name);
      setCategory(editingTempario.category);
      setSequenceNumber(editingTempario.code.split("-")[1] ?? "");
      setEstimatedHours(String(editingTempario.estimated_hours));
      setYearFrom(editingTempario.year_from ? String(editingTempario.year_from) : "");
      setYearTo(editingTempario.year_to ? String(editingTempario.year_to) : "");
      setSelectedVehicles(
        new Set(editingTempario.compatible_vehicles.map((v) => `${v.brand}|${v.model}`))
      );
      setTools(editingTempario.tools);
      setRequiresParts(editingTempario.requires_parts);
      setParts(
        editingTempario.parts.length
          ? editingTempario.parts.map((p) => ({
              partId: p.part_id ?? "",
              search: p.name,
              quantity: String(p.quantity),
              unitCost: String(p.unit_cost),
            }))
          : [emptyPart()]
      );
    } else {
      setName("");
      setCategory("mantenimiento_preventivo");
      setSequenceNumber("");
      setEstimatedHours("1.0");
      setYearFrom("2015");
      setYearTo(String(new Date().getFullYear()));
      setSelectedVehicles(new Set());
      setTools([]);
      setRequiresParts(true);
      setParts([emptyPart()]);
    }
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

  function addTool() {
    if (!toolInput.trim()) return;
    setTools((prev) => [...prev, toolInput.trim()]);
    setToolInput("");
  }

  function removeTool(index: number) {
    setTools((prev) => prev.filter((_, i) => i !== index));
  }

  function updatePart(index: number, patch: Partial<PartDraft>) {
    setParts((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  }

  function addPart() {
    setParts((prev) => [...prev, emptyPart()]);
  }

  function removePart(index: number) {
    setParts((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  const validParts = useMemo(
    () =>
      requiresParts
        ? parts
            .filter((p) => p.search.trim())
            .map((p) => ({
              part_id: p.partId || null,
              name: p.search.trim(),
              quantity: Number(p.quantity) || 1,
              unit_cost: Number(p.unitCost) || 0,
            }))
        : [],
    [parts, requiresParts]
  );

  const partsCost = useMemo(
    () => validParts.reduce((sum, p) => sum + p.quantity * p.unit_cost, 0),
    [validParts]
  );
  const partsMargin = partsCost * 0.3;
  const laborCost = (Number(estimatedHours) || 0) * hourlyRate;
  const totalPrice = partsCost + partsMargin + laborCost;

  async function handleSubmit() {
    if (!name.trim()) {
      setError("El nombre del servicio es obligatorio.");
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
        parts: validParts,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el tempario.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-navy/40" />
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-navy/10 px-6 py-4">
          <div>
            <h2 className="font-display text-xl font-bold text-navy">
              {editingTempario ? "Editar Tempario" : "Nuevo Tempario"}
            </h2>
            <p className="text-xs text-steel">
              El código se genera con la sigla de la categoría · el precio se calcula automáticamente
            </p>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="rounded-lg p-2 text-steel hover:bg-ash hover:text-navy">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Nombre del servicio</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Cambio de aceite y filtro"
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TemparioCategory)}
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
              <label className="mb-1.5 block text-sm font-medium text-navy">Código del servicio</label>
              <div className="flex overflow-hidden rounded-xl border border-navy/15">
                <span className="flex items-center bg-ash px-3 text-sm font-mono text-blue">
                  {currentPrefix}-
                </span>
                <input
                  value={sequenceNumber}
                  onChange={(e) => setSequenceNumber(e.target.value.replace(/\D/g, ""))}
                  placeholder="Automático"
                  className="w-full px-3 py-2.5 text-sm outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">Horas estimadas</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">Año compatible desde</label>
              <select
                value={yearFrom}
                onChange={(e) => setYearFrom(e.target.value)}
                className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
              >
                <option value="">—</option>
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">Hasta</label>
              <select
                value={yearTo}
                onChange={(e) => setYearTo(e.target.value)}
                className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
              >
                <option value="">—</option>
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-blue">
              Vehículos compatibles
            </p>
            <div className="space-y-4 rounded-xl border border-navy/10 p-4">
              {Object.entries(VEHICLE_CATALOG).map(([brand, models]) => (
                <div key={brand}>
                  <p className="mb-2 font-semibold text-navy">{brand}</p>
                  <div className="flex flex-wrap gap-2">
                    {models.map((model) => {
                      const key = `${brand}|${model}`;
                      const checked = selectedVehicles.has(key);
                      return (
                        <label
                          key={model}
                          className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                            checked ? "border-blue bg-blue-light text-blue" : "border-navy/15 text-navy"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleVehicle(brand, model)}
                            className="h-3.5 w-3.5"
                          />
                          {model}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
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
                    <button type="button" onClick={() => removeTool(i)} className="text-steel hover:text-red-500">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
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
                {parts.map((p, i) => {
                  const results =
                    p.search && !p.partId
                      ? catalogParts
                          .filter(
                            (cp) =>
                              cp.code.toLowerCase().includes(p.search.toLowerCase()) ||
                              cp.name.toLowerCase().includes(p.search.toLowerCase())
                          )
                          .slice(0, 6)
                      : [];
                  return (
                    <div key={i}>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-steel" />
                          <input
                            value={p.search}
                            onChange={(e) =>
                              updatePart(i, { search: e.target.value, partId: "" })
                            }
                            placeholder="Buscar en el catálogo por código o nombre..."
                            className="w-full rounded-lg border border-navy/15 py-2 pl-8 pr-3 text-sm outline-none focus:border-blue"
                          />
                        </div>
                        <input
                          type="number"
                          min="1"
                          value={p.quantity}
                          onChange={(e) => updatePart(i, { quantity: e.target.value })}
                          className="w-16 rounded-lg border border-navy/15 px-2 py-2 text-center text-sm outline-none focus:border-blue"
                        />
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-steel">$</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={p.unitCost}
                            onChange={(e) => updatePart(i, { unitCost: e.target.value })}
                            className="w-20 rounded-lg border border-navy/15 px-2 py-2 text-sm outline-none focus:border-blue"
                          />
                        </div>
                        <span className="w-20 shrink-0 text-right text-sm font-medium text-navy">
                          ${((Number(p.quantity) || 0) * (Number(p.unitCost) || 0)).toFixed(2)}
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
                                  unitCost: String(cp.price),
                                })
                              }
                              className="block w-full px-3 py-1.5 text-left text-xs hover:bg-ash"
                            >
                              <span className="font-mono text-blue">{cp.code}</span>{" "}
                              <span className="text-navy">{cp.name}</span>{" "}
                              <span className="text-steel">· ${cp.price.toFixed(2)}</span>
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

          <div className="rounded-xl border border-blue/20 bg-blue-light/40 p-4">
            <p className="mb-3 font-display font-bold text-navy">Precio calculado</p>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-steel">
                <span>Costo de repuestos</span>
                <span>${partsCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b border-navy/10 pb-1.5 text-steel">
                <span>Repuestos + 30% (margen)</span>
                <span>${partsMargin.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-steel">
                <span>
                  Mano de obra ({estimatedHours || 0} h × ${hourlyRate.toFixed(2)}/h)
                </span>
                <span>${laborCost.toFixed(2)}</span>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-navy/10 pt-3">
              <span className="font-display font-bold text-navy">Precio total</span>
              <span className="font-display text-xl font-bold text-blue">${totalPrice.toFixed(2)}</span>
            </div>
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex items-center justify-between border-t border-navy/10 px-6 py-4">
          <span className="font-mono text-xs text-steel">
            {currentPrefix}-{sequenceNumber || "···"}
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
              disabled={submitting}
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