"use client";

import { useEffect, useState } from "react";
import { X, Loader2, Plus, Search } from "lucide-react";
import { useParts } from "@/hooks/useParts";
import { createStockIn } from "@/lib/api/warehouse";
import WarehousePicker from "./WarehousePicker";
import type { Warehouse } from "@/types/warehouse";
import { useModuleAccess } from "@/hooks/useModuleAccess";

const DEFAULT_REASONS = ["Ajuste de inventario", "Devolución de cliente", "Otro"];

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
  const { canEdit } = useModuleAccess("almacen");
  const { parts } = useParts(filialId);
  const [warehouseId, setWarehouseId] = useState(defaultWarehouseId ?? warehouses[0]?.id ?? "");
  const [reasons, setReasons] = useState(DEFAULT_REASONS);
  const [reason, setReason] = useState(DEFAULT_REASONS[0]);
  const [otherReason, setOtherReason] = useState("");
  const [editingReasons, setEditingReasons] = useState(false);
  const [newReason, setNewReason] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([emptyLine()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setWarehouseId(defaultWarehouseId ?? warehouses[0]?.id ?? "");
      try {
        const saved = localStorage.getItem("bayline.stockInReasons");
        if (saved) setReasons(JSON.parse(saved) as string[]);
      } catch {
        // Keep default reasons.
      }
    }
  }, [defaultWarehouseId, open, warehouses]);

  function updateLine(index: number, patch: Partial<LineDraft>) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  function resultsFor(term: string) {
    if (!term) return [];
    const t = term.toLowerCase();
    return parts.filter((p) => p.code.toLowerCase().includes(t) || p.name.toLowerCase().includes(t)).slice(0, 6);
  }

  async function handleSubmit() {
    const wh = warehouseId || warehouses[0]?.id;
    const validLines = lines.filter((l) => l.partId && Number(l.quantity) > 0);
    if (!wh || validLines.length === 0 || (reason === "Otro" && !otherReason.trim())) {
      setError("Selecciona almacén, motivo y al menos un repuesto con cantidad.");
      return;
    }
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
              />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between"><label className="block text-sm font-medium text-navy">Motivo</label>{canEdit && <button type="button" onClick={() => setEditingReasons((value) => !value)} className="rounded-full border border-blue/25 px-2 py-0.5 text-sm font-semibold text-blue">+</button>}</div>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
              >
                {reasons.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              {reason === "Otro" && <input value={otherReason} onChange={(event) => setOtherReason(event.target.value)} placeholder="Escribe el motivo de entrada" className="mt-2 w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue" />}
              {editingReasons && <div className="mt-2 rounded-xl border border-navy/10 bg-ash p-3"><div className="flex gap-2"><input value={newReason} onChange={(event) => setNewReason(event.target.value)} placeholder="Nuevo motivo" className="min-w-0 flex-1 rounded-lg border border-navy/15 bg-white px-3 py-2 text-xs" /><button type="button" onClick={() => { const value = newReason.trim(); if (!value || reasons.some((item) => item.toLowerCase() === value.toLowerCase())) return; const next = [...reasons.filter((item) => item !== "Otro"), value, "Otro"]; setReasons(next); setReason(value); setNewReason(""); localStorage.setItem("bayline.stockInReasons", JSON.stringify(next)); }} className="rounded-lg bg-blue px-3 text-xs font-semibold text-white">Agregar</button></div><div className="mt-2 flex flex-wrap gap-1">{reasons.filter((item) => !DEFAULT_REASONS.includes(item)).map((item) => <button type="button" key={item} onClick={() => { const next = reasons.filter((reasonItem) => reasonItem !== item); setReasons(next); if (reason === item) setReason(next[0]); localStorage.setItem("bayline.stockInReasons", JSON.stringify(next)); }} className="rounded-full bg-white px-2 py-1 text-[10px] text-red-600">{item} ×</button>)}</div></div>}
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-navy/10 p-4">
            {lines.map((line, i) => (
              <div key={i} className="grid grid-cols-[1fr_90px_100px_90px_auto] items-start gap-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-steel" />
                  <input
                    value={line.search}
                    onChange={(e) => updateLine(i, { search: e.target.value, partId: "" })}
                    placeholder="Buscar por código o nombre..."
                    className="w-full rounded-lg border border-navy/15 py-2 pl-8 pr-2 text-sm outline-none focus:border-blue"
                  />
                  {line.search && !line.partId && resultsFor(line.search).length > 0 && (
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
    </div>
  );
}
