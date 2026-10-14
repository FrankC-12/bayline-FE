"use client";

import { createOperationAttempt } from "@/lib/operation-attempt";

import { NumberInput } from "@/components/ui/NumberInput";

import { useEffect, useRef, useState } from "react";
import { X, Loader2, Search } from "lucide-react";
import { useParts } from "@/hooks/useParts";
import { useListLoader } from "@/hooks/useListLoader";
import { apiFetch } from "@/lib/api/client";
import type { StockInReason } from "@/types/warehouse";
import { createStockOut } from "@/lib/api/warehouse";
import WarehousePicker from "./WarehousePicker";
import type { Warehouse } from "@/types/warehouse";



interface StockOutModalProps {
  open: boolean;
  onClose: () => void;
  filialId: string;
  warehouses: Warehouse[];
  defaultWarehouseId?: string;
  onSaved: () => void;
  onCreateWarehouse: (name: string) => Promise<Warehouse | undefined>;
}

export default function StockOutModal({
  open,
  onClose,
  filialId,
  warehouses,
  defaultWarehouseId,
  onSaved,
  onCreateWarehouse,
}: StockOutModalProps) {
  const { parts } = useParts(filialId);
  const [search, setSearch] = useState("");
  const [partId, setPartId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [warehouseId, setWarehouseId] = useState(defaultWarehouseId ?? warehouses[0]?.id ?? "");
  const { data: reasons } = useListLoader<StockInReason>(()=>apiFetch(`/stock-out-reasons?filial_id=${filialId}`),[filialId]);
  const [reason, setReason] = useState("");
  const [reference, setReference] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) setWarehouseId(defaultWarehouseId ?? warehouses[0]?.id ?? "");
  }, [defaultWarehouseId, open, warehouses]);

  const results = search && !partId
    ? parts.filter((p) => p.code.toLowerCase().includes(search.toLowerCase()) || p.name.toLowerCase().includes(search.toLowerCase())).slice(0, 6)
    : [];

  const canSubmit = Boolean(partId && Number(quantity) > 0 && warehouseId);

  const attempt = useRef(createOperationAttempt());

  async function handleSubmit() {
    if (!canSubmit) return;
    if (!reason) { setError("Selecciona el motivo de salida."); return; }
    setSubmitting(true);
    setError(null);
    try {
      const operation = {
        filial_id: filialId,
        warehouse_id: warehouseId,
        part_id: partId,
        quantity: Number(quantity),
        reason_id: reason || undefined,
        reason: reasons.find(item=>item.id===reason)?.name === "Devolución a proveedor" ? "devolucion_proveedor" : "otro",
        reference: reference || null,
      };
      await createStockOut({...operation, request_id: attempt.current.idFor(operation)});
      setSearch("");
      setPartId("");
      setQuantity("");
      setReference("");
      onSaved();
      onClose();
      attempt.current.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar la salida.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-navy/40" />
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-navy/10 px-6 py-4">
          <h2 className="font-display text-lg font-bold text-navy">Registrar salida de repuestos</h2>
          <button onClick={onClose} aria-label="Cerrar" className="rounded-lg p-2 text-steel hover:bg-ash hover:text-navy">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Repuesto</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPartId("");
                }}
                placeholder="Buscar por código o nombre..."
                className="w-full rounded-xl border border-navy/15 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
              />
              {results.length > 0 && (
                <div className="absolute z-10 mt-1 w-full divide-y divide-navy/5 rounded-xl border border-navy/10 bg-white shadow-lg">
                  {results.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setPartId(p.id);
                        setSearch(`${p.code} · ${p.name}`);
                      }}
                      className="block w-full px-4 py-2 text-left text-sm hover:bg-ash"
                    >
                      <span className="font-mono text-blue">{p.code}</span> {p.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Cantidad</label>
            <NumberInput
              min="1"
              value={quantity}
              onValueChange={(value) => setQuantity(value)}
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
            />
          </div>

          <WarehousePicker
            label="Almacén origen"
            warehouses={warehouses}
            value={warehouseId}
            onChange={setWarehouseId}
            onCreate={onCreateWarehouse}
          />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Motivo</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
            >
              <option value="">Selecciona un motivo…</option>
              {reasons.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Vincular a ODS o venta (opcional)</label>
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Ej. ODS-2044 o Venta #118"
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
            />
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Registrar salida
          </button>
        </div>
      </div>
    </div>
  );
}
