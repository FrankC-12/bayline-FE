"use client";

import { useEffect, useState } from "react";
import { X, Loader2, Plus, Search } from "lucide-react";
import { useParts } from "@/hooks/useParts";
import { useStockInReasons } from "@/hooks/useStockInReasons";
import { createStockIn } from "@/lib/api/warehouse";
import WarehousePicker from "./WarehousePicker";
import CreatePartModal from "@/components/parts/CreatePartModal";
import type { Warehouse } from "@/types/warehouse";

interface LineDraft {
  partId: string;
  search: string;
  quantity: string;
  unitCost: string;
  location: string;
}

function emptyLine(): LineDraft {
  return { partId: "", search: "", quantity: "", unitCost: "0", location: "" };
}

interface StockInModalProps {
  open: boolean;
  onClose: () => void;
  filialId: string;
  warehouses: Warehouse[];
  defaultWarehouseId?: string;
  onSaved: () => void;
  onCreateWarehouse: (name: string) => Promise<Warehouse | undefined>;
}

export default function StockInModal({
  open,
  onClose,
  filialId,
  warehouses,
  defaultWarehouseId,
  onSaved,
  onCreateWarehouse,
}: StockInModalProps) {
  const { parts, addPart } = useParts(filialId);
  const { reasons: catalogReasons } = useStockInReasons(filialId);
  const [warehouseId, setWarehouseId] = useState(defaultWarehouseId ?? warehouses[0]?.id ?? "");
  const [reason, setReason] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([emptyLine()]);
  const [lineErrors, setLineErrors] = useState<Record<number, string>>({});
  const [quickCreateLineIndex, setQuickCreateLineIndex] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setWarehouseId(defaultWarehouseId ?? warehouses[0]?.id ?? "");
    }
  }, [defaultWarehouseId, open, warehouses]);

  useEffect(() => {
    if (!reason && catalogReasons.length > 0) setReason(catalogReasons[0].name);
  }, [catalogReasons, reason]);

  function updateLine(index: number, patch: Partial<LineDraft>) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
    setLineErrors((prev) => {
      if (!(index in prev)) return prev;
      const next = { ...prev };
      delete next[index];
      return next;
    });
  }

  function resultsFor(term: string) {
    if (!term) return [];
    const t = term.toLowerCase();
    return parts.filter((p) => p.code.toLowerCase().includes(t) || p.name.toLowerCase().includes(t)).slice(0, 6);
  }

  async function handleSubmit() {
    const wh = warehouseId || warehouses[0]?.id;

    // A line where someone typed something but never picked a real catalog
    // match doesn't get silently dropped — it's flagged on that line, not
    // folded into the generic "something's missing" message below.
    const newLineErrors: Record<number, string> = {};
    lines.forEach((l, i) => {
      if (l.search.trim() && !l.partId) {
        newLineErrors[i] = "Este repuesto no existe en el catálogo.";
      }
    });
    if (Object.keys(newLineErrors).length > 0) {
      setLineErrors(newLineErrors);
      return;
    }

    const validLines = lines.filter((l) => l.partId && Number(l.quantity) > 0);
    const missing: string[] = [];
    if (!wh) missing.push("almacén");
    if (!reason || (reason === "Otro" && !otherReason.trim())) missing.push("motivo");
    if (validLines.length === 0) missing.push("al menos un repuesto con cantidad");
    if (missing.length > 0) {
      setError(`Selecciona ${missing.join(", ")}.`);
      return;
    }

    setLineErrors({});
    setSubmitting(true);
    setError(null);
    try {
      await createStockIn(
        filialId,
        wh,
        reason === "Otro" ? otherReason.trim() : reason,
        validLines.map((l) => ({
          part_id: l.partId,
          quantity: Number(l.quantity),
          unit_cost: Number(l.unitCost) || 0,
          location: l.location || null,
        }))
      );
      setLines([emptyLine()]);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar la entrada.");
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
            <h2 className="font-display text-lg font-bold text-navy">Entrada de repuestos</h2>
            <p className="text-xs text-steel">Agrega una o varias líneas · cada una crea su propio lote FIFO.</p>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="rounded-lg p-2 text-steel hover:bg-ash hover:text-navy">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <WarehousePicker
                label="Almacén destino"
                warehouses={warehouses}
                value={warehouseId}
                onChange={setWarehouseId}
                onCreate={onCreateWarehouse}
                allowCreate={false}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">Motivo</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
              >
                {catalogReasons.map((r) => (
                  <option key={r.id} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </select>
              {reason === "Otro" && (
                <input
                  value={otherReason}
                  onChange={(event) => setOtherReason(event.target.value)}
                  placeholder="Escribe el motivo de entrada"
                  className="mt-2 w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
                />
              )}
              <p className="mt-1.5 text-[11px] text-steel">
                Los motivos se administran en Ajustes → Motivos de Entrada.
              </p>
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-navy/10 p-4">
            {lines.map((line, i) => (
              <div key={i}>
                <div className="grid grid-cols-[1fr_90px_100px_90px_auto] items-start gap-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-steel" />
                    <input
                      value={line.search}
                      onChange={(e) => updateLine(i, { search: e.target.value, partId: "" })}
                      placeholder="Buscar por código o nombre..."
                      className={`w-full rounded-lg border py-2 pl-8 pr-2 text-sm outline-none focus:border-blue ${
                        lineErrors[i] ? "border-red-400" : "border-navy/15"
                      }`}
                    />
                    {line.search && !line.partId && (
                      resultsFor(line.search).length > 0 ? (
                        <div className="absolute z-10 mt-1 w-full divide-y divide-navy/5 rounded-lg border border-navy/10 bg-white shadow-lg">
                          {resultsFor(line.search).map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => updateLine(i, { partId: p.id, search: `${p.code} · ${p.name}` })}
                              className="block w-full px-3 py-1.5 text-left text-xs hover:bg-ash"
                            >
                              <span className="font-mono text-blue">{p.code}</span> {p.name}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="absolute z-10 mt-1 w-full rounded-lg border border-navy/10 bg-white p-3 shadow-lg">
                          <p className="text-xs text-steel">Sin resultados en catálogo.</p>
                          <button
                            type="button"
                            onClick={() => setQuickCreateLineIndex(i)}
                            className="mt-2 flex items-center gap-1 text-xs font-semibold text-blue hover:text-navy"
                          >
                            <Plus className="h-3 w-3" />
                            Crear repuesto en catálogo
                          </button>
                        </div>
                      )
                    )}
                  </div>
                  <input
                    type="number"
                    min="1"
                    placeholder="Cant."
                    value={line.quantity}
                    onChange={(e) => updateLine(i, { quantity: e.target.value })}
                    className="rounded-lg border border-navy/15 px-2 py-2 text-sm outline-none focus:border-blue"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={line.unitCost}
                    onChange={(e) => updateLine(i, { unitCost: e.target.value })}
                    className="rounded-lg border border-navy/15 px-2 py-2 text-sm outline-none focus:border-blue"
                  />
                  <input
                    placeholder="Ubic."
                    value={line.location}
                    onChange={(e) => updateLine(i, { location: e.target.value })}
                    className="rounded-lg border border-navy/15 px-2 py-2 text-sm outline-none focus:border-blue"
                  />
                  <button
                    type="button"
                    onClick={() => setLines((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev))}
                    className="rounded-lg border border-navy/15 p-2 text-red-500 hover:bg-red-50"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                {lineErrors[i] && <p className="mt-1 text-xs text-red-600">{lineErrors[i]}</p>}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setLines((prev) => [...prev, emptyLine()])}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-navy/20 py-2 text-sm font-semibold text-blue hover:bg-blue-light"
            >
              <Plus className="h-4 w-4" />
              Agregar otro repuesto
            </button>
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Registrar entrada
          </button>
        </div>
      </div>

      <CreatePartModal
        open={quickCreateLineIndex !== null}
        onClose={() => setQuickCreateLineIndex(null)}
        filialId={filialId}
        initialName={quickCreateLineIndex !== null ? lines[quickCreateLineIndex]?.search ?? "" : ""}
        onCreate={addPart}
        onSaved={(part) => {
          if (quickCreateLineIndex === null) return;
          updateLine(quickCreateLineIndex, { partId: part.id, search: `${part.code} · ${part.name}` });
        }}
      />
    </div>
  );
}
