"use client";

import { useState } from "react";
import { X, Loader2, Upload, CheckCircle2 } from "lucide-react";
import * as XLSX from "xlsx";
import { bulkCreateLots, type BulkLotItem, type BulkLotResult } from "@/lib/api/warehouse";
import WarehousePicker from "./WarehousePicker";
import type { Warehouse } from "@/types/warehouse";

interface BulkStockInModalProps {
  open: boolean;
  onClose: () => void;
  filialId: string;
  warehouses: Warehouse[];
  defaultWarehouseId?: string;
  onSaved: () => void;
  onCreateWarehouse: (name: string) => Promise<Warehouse | undefined>;
}

function parseTextRows(text: string): BulkLotItem[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const cols = line.split(/\t|,/).map((c) => c.trim());
      return {
        part_code: cols[0] ?? "",
        quantity: Number(cols[1]) || 0,
        unit_cost: Number(cols[2]) || 0,
        location: cols[3] || null,
      };
    })
    .filter((item) => item.part_code && item.quantity > 0);
}

export default function BulkStockInModal({
  open,
  onClose,
  filialId,
  warehouses,
  defaultWarehouseId,
  onSaved,
  onCreateWarehouse,
}: BulkStockInModalProps) {
  const [warehouseId, setWarehouseId] = useState(defaultWarehouseId ?? warehouses[0]?.id ?? "");
  const [mode, setMode] = useState<"text" | "excel">("text");
  const [textValue, setTextValue] = useState("");
  const [items, setItems] = useState<BulkLotItem[]>([]);
  const [fileName, setFileName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BulkLotResult | null>(null);

  function handleTextChange(value: string) {
    setTextValue(value);
    setItems(parseTextRows(value));
    setError(null);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError(null);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, { header: 1 });
      const dataRows = rows.slice(1);
      const parsed: BulkLotItem[] = dataRows
        .map((row) => ({
          part_code: String(row[0] ?? "").trim(),
          quantity: Number(row[1]) || 0,
          unit_cost: Number(row[2]) || 0,
          location: row[3] ? String(row[3]).trim() : null,
        }))
        .filter((item) => item.part_code && item.quantity > 0);
      setItems(parsed);
    } catch {
      setError("No se pudo leer el archivo. Verifica que sea un Excel (.xlsx) o CSV válido.");
    }
  }

  async function handleImport() {
    if (items.length === 0 || !warehouseId) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await bulkCreateLots(filialId, warehouseId, items);
      setResult(res);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo importar el inventario.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    setTextValue("");
    setItems([]);
    setFileName("");
    setResult(null);
    setError(null);
    setMode("text");
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={handleClose} className="absolute inset-0 bg-navy/40" />
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-navy/10 px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-bold text-navy">Carga masiva de repuestos</h2>
            <p className="text-xs text-steel">Sube un archivo de inventario o pega una lista de texto.</p>
          </div>
          <button onClick={handleClose} aria-label="Cerrar" className="rounded-lg p-2 text-steel hover:bg-ash hover:text-navy">
            <X className="h-5 w-5" />
          </button>
        </div>

        {result ? (
          <div className="p-6">
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Se crearon {result.created.length} lotes.
            </div>
            {result.skipped.length > 0 && (
              <div className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                No se encontraron {result.skipped.length} código(s) en el catálogo: {result.skipped.join(", ")}
              </div>
            )}
            <button
              onClick={handleClose}
              className="mt-6 w-full rounded-full bg-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-navy"
            >
              Listo
            </button>
          </div>
        ) : (
          <div className="p-6">
            <div className="mb-4">
              <WarehousePicker
                label="Almacén destino"
                warehouses={warehouses}
                value={warehouseId}
                onChange={setWarehouseId}
                onCreate={onCreateWarehouse}
              />
            </div>

            <div className="mb-4 flex rounded-full border border-navy/15 p-1">
              <button
                onClick={() => setMode("text")}
                className={`flex-1 rounded-full py-2 text-sm font-medium transition ${mode === "text" ? "bg-navy text-white" : "text-steel"}`}
              >
                Pegar texto
              </button>
              <button
                onClick={() => setMode("excel")}
                className={`flex-1 rounded-full py-2 text-sm font-medium transition ${mode === "excel" ? "bg-navy text-white" : "text-steel"}`}
              >
                Subir Excel
              </button>
            </div>

            {mode === "text" ? (
              <div>
                <p className="mb-2 text-xs text-steel">
                  Una línea por lote: <span className="font-mono">código, cantidad, costo, ubicación (opcional)</span>
                </p>
                <textarea
                  value={textValue}
                  onChange={(e) => handleTextChange(e.target.value)}
                  rows={8}
                  placeholder={"REP-1001, 40, 4.50, A1-03\nREP-1002, 15, 18.20, A1-07"}
                  className="w-full rounded-xl border border-navy/15 px-4 py-2.5 font-mono text-xs outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
                />
              </div>
            ) : (
              <div>
                <p className="mb-2 text-xs text-steel">
                  Archivo .xlsx o .csv con columnas: Código, Cantidad, Costo, Ubicación (opcional) — la primera fila se asume encabezado.
                </p>
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-navy/20 px-4 py-10 text-center transition hover:border-blue/40 hover:bg-blue-light">
                  <Upload className="h-6 w-6 text-steel" />
                  <span className="text-sm font-semibold text-blue">
                    {fileName || "Arrastra tu archivo aquí o haz clic para subirlo"}
                  </span>
                  <span className="text-xs text-steel">Excel (.xlsx, .xls) o texto (.csv, .txt)</span>
                  <input type="file" accept=".xlsx,.xls,.csv,.txt" onChange={handleFile} className="hidden" />
                </label>
              </div>
            )}

            {items.length > 0 && (
              <p className="mt-3 text-sm font-semibold text-navy">{items.length} líneas detectadas</p>
            )}

            {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

            <button
              onClick={handleImport}
              disabled={items.length === 0 || !warehouseId || submitting}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Importar {items.length > 0 ? `${items.length} líneas` : ""}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}