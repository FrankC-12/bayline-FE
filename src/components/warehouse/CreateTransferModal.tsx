"use client";

import { useEffect, useState } from "react";
import { X, Loader2, Plus, Search } from "lucide-react";
import { useParts } from "@/hooks/useParts";
import WarehousePicker from "./WarehousePicker";
import type { Warehouse } from "@/types/warehouse";
import type { TransferLineInput } from "@/lib/api/warehouse";

interface LineDraft {
  partId: string;
  search: string;
  quantity: string;
}

function emptyLine(partId = "", search = "", quantity = ""): LineDraft {
  return { partId, search, quantity };
}

interface CreateTransferModalProps {
  open: boolean;
  onClose: () => void;
  filialId: string;
  warehouses: Warehouse[];
  onSubmit: (originId: string, destinationId: string, lines: TransferLineInput[]) => Promise<void>;
  initialOriginId?: string;
  initialDestinationId?: string;
  initialLines?: LineDraft[];
  onCreateWarehouse: (name: string) => Promise<Warehouse | undefined>;
}

export default function CreateTransferModal({
  open,
  onClose,
  filialId,
  warehouses,
  onSubmit,
  initialOriginId,
  initialDestinationId,
  initialLines,
  onCreateWarehouse,
}: CreateTransferModalProps) {
  const { parts } = useParts(filialId);
  const [originId, setOriginId] = useState(initialOriginId ?? warehouses[0]?.id ?? "");
  const [destinationId, setDestinationId] = useState(
    initialDestinationId ?? warehouses[1]?.id ?? warehouses[0]?.id ?? ""
  );
  const [lines, setLines] = useState<LineDraft[]>(initialLines?.length ? initialLines : [emptyLine()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setOriginId(initialOriginId ?? warehouses[0]?.id ?? "");
    setDestinationId(initialDestinationId ?? warehouses[1]?.id ?? warehouses[0]?.id ?? "");
    setLines(initialLines?.length ? initialLines : [emptyLine()]);
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function updateLine(index: number, patch: Partial<LineDraft>) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  function resultsFor(term: string) {
    if (!term) return [];
    const t = term.toLowerCase();
    return parts.filter((p) => p.code.toLowerCase().includes(t) || p.name.toLowerCase().includes(t)).slice(0, 6);
  }

  async function handleSubmit() {
    const validLines = lines.filter((l) => l.partId && Number(l.quantity) > 0);
    if (!originId || !destinationId || originId === destinationId || validLines.length === 0) {
      setError("Selecciona almacenes distintos y al menos un repuesto con cantidad.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(
        originId,
        destinationId,
        validLines.map((l) => ({ part_id: l.partId, quantity: Number(l.quantity) }))
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la transferencia.");
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
          <h2 className="font-display text-lg font-bold text-navy">Nueva Orden de Transferencia</h2>
          <button onClick={onClose} aria-label="Cerrar" className="rounded-lg p-2 text-steel hover:bg-ash hover:text-navy">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div className="grid grid-cols-2 gap-4">
            <WarehousePicker
              label="Almacén origen"
              warehouses={warehouses}
              value={originId}
              onChange={setOriginId}
              onCreate={onCreateWarehouse}
            />
            <WarehousePicker
              label="Almacén destino"
              warehouses={warehouses}
              value={destinationId}
              onChange={setDestinationId}
              onCreate={onCreateWarehouse}
            />
          </div>

          <div className="space-y-3 rounded-xl border border-navy/10 p-4">
            {lines.map((line, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="relative flex-1">
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
                  className="w-20 rounded-lg border border-navy/15 px-2 py-2 text-center text-sm outline-none focus:border-blue"
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
              Agregar repuesto
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
            Crear Orden de Transferencia
          </button>
        </div>
      </div>
    </div>
  );
}