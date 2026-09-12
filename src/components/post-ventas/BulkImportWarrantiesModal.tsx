"use client";

import { useState } from "react";
import { X, Loader2, Upload, FileText, CheckCircle2 } from "lucide-react";
import * as XLSX from "xlsx";
import type { BulkVehicleWarrantyItem, BulkVehicleWarrantyResult } from "@/lib/api/vehicleWarranties";

interface BulkImportWarrantiesModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (items: BulkVehicleWarrantyItem[]) => Promise<BulkVehicleWarrantyResult>;
}

function toItem(cols: (string | number)[]): BulkVehicleWarrantyItem {
  const num = (v: string | number | undefined) => {
    const n = Number(String(v ?? "").trim());
    return v !== undefined && v !== "" && Number.isFinite(n) ? n : null;
  };
  return {
    vin: String(cols[0] ?? "").trim().toUpperCase(),
    brand: String(cols[1] ?? "").trim(),
    model: String(cols[2] ?? "").trim() || null,
    starts_at: String(cols[3] ?? "").trim(),
    duration_months: num(cols[4]),
    duration_km: num(cols[5]),
    note: String(cols[6] ?? "").trim() || null,
  };
}

function isValid(item: BulkVehicleWarrantyItem): boolean {
  return (
    item.vin.length === 17 &&
    !!item.brand &&
    /^\d{4}-\d{2}-\d{2}$/.test(item.starts_at) &&
    (item.duration_months != null || item.duration_km != null)
  );
}

function parseTextRows(text: string): BulkVehicleWarrantyItem[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => toItem(line.split(/\t|,/).map((c) => c.trim())))
    .filter(isValid);
}

export default function BulkImportWarrantiesModal({ open, onClose, onImport }: BulkImportWarrantiesModalProps) {
  const [mode, setMode] = useState<"text" | "excel">("text");
  const [textValue, setTextValue] = useState("");
  const [items, setItems] = useState<BulkVehicleWarrantyItem[]>([]);
  const [fileName, setFileName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BulkVehicleWarrantyResult | null>(null);

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
      const dataRows = rows.slice(1); // la primera fila se asume encabezado
      setItems(dataRows.map(toItem).filter(isValid));
    } catch {
      setError("No se pudo leer el archivo. Verifica que sea un Excel (.xlsx) o CSV válido.");
    }
  }

  async function handleImport() {
    if (items.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await onImport(items);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo importar las garantías.");
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
          <h2 className="font-display text-lg font-bold text-navy">Carga masiva de garantías de fábrica</h2>
          <button onClick={handleClose} aria-label="Cerrar" className="rounded-lg p-2 text-steel hover:bg-ash hover:text-navy">
            <X className="h-5 w-5" />
          </button>
        </div>

        {result ? (
          <div className="p-6">
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Se registraron {result.created.length} garantías.
            </div>
            {result.skipped.length > 0 && (
              <div className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Se omitieron {result.skipped.length} porque el VIN ya tenía garantía registrada: {result.skipped.join(", ")}
              </div>
            )}
            <button onClick={handleClose} className="mt-6 w-full rounded-full bg-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-navy">
              Listo
            </button>
          </div>
        ) : (
          <div className="p-6">
            <div className="mb-4 flex rounded-full border border-navy/15 p-1">
              <button onClick={() => setMode("text")} className={`flex-1 rounded-full py-2 text-sm font-medium transition ${mode === "text" ? "bg-navy text-white" : "text-steel"}`}>
                Pegar texto
              </button>
              <button onClick={() => setMode("excel")} className={`flex-1 rounded-full py-2 text-sm font-medium transition ${mode === "excel" ? "bg-navy text-white" : "text-steel"}`}>
                Subir Excel
              </button>
            </div>

            {mode === "text" ? (
              <div>
                <p className="mb-2 text-xs text-steel">
                  Una línea por vehículo:{" "}
                  <span className="font-mono">VIN, marca, modelo, fecha inicio (AAAA-MM-DD), meses, km, nota</span>
                  . Marca y modelo se llenan solos; meses o km — al menos uno es obligatorio.
                </p>
                <textarea
                  value={textValue}
                  onChange={(e) => handleTextChange(e.target.value)}
                  rows={8}
                  placeholder={"1HGCM82633A004352, Toyota, Corolla, 2026-01-15, 36, ,\n2T1BURHE0JC014565, Chevrolet, Aveo, 2026-02-01, , 100000,"}
                  className="w-full rounded-xl border border-navy/15 px-4 py-2.5 font-mono text-xs outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
                />
              </div>
            ) : (
              <div>
                <p className="mb-2 text-xs text-steel">
                  Archivo .xlsx o .csv con columnas: VIN, Marca, Modelo, Fecha inicio (AAAA-MM-DD), Meses, Km, Nota. La primera fila se asume encabezado.
                </p>
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-navy/20 px-4 py-8 text-center transition hover:border-blue/40 hover:bg-blue-light">
                  <Upload className="h-6 w-6 text-steel" />
                  <span className="text-sm font-medium text-navy">{fileName || "Selecciona un archivo"}</span>
                  <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="hidden" />
                </label>
              </div>
            )}

            {items.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-navy">
                  <FileText className="h-4 w-4" />
                  {items.length} garantías detectadas
                </p>
                <div className="max-h-48 overflow-y-auto rounded-xl border border-navy/10">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-ash">
                      <tr>
                        <th className="px-3 py-2 font-mono uppercase text-steel">VIN</th>
                        <th className="px-3 py-2 font-mono uppercase text-steel">Marca</th>
                        <th className="px-3 py-2 font-mono uppercase text-steel">Inicio</th>
                        <th className="px-3 py-2 font-mono uppercase text-steel">Meses</th>
                        <th className="px-3 py-2 font-mono uppercase text-steel">Km</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy/5">
                      {items.slice(0, 20).map((item, i) => (
                        <tr key={i}>
                          <td className="px-3 py-1.5 font-mono text-blue">{item.vin}</td>
                          <td className="px-3 py-1.5 text-navy">{item.brand}</td>
                          <td className="px-3 py-1.5 text-navy">{item.starts_at}</td>
                          <td className="px-3 py-1.5 text-navy">{item.duration_months ?? "—"}</td>
                          <td className="px-3 py-1.5 text-navy">{item.duration_km ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {items.length > 20 && <p className="mt-1 text-xs text-steel">... y {items.length - 20} más.</p>}
              </div>
            )}

            {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

            <button
              onClick={handleImport}
              disabled={items.length === 0 || submitting}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Importar {items.length > 0 ? `${items.length} garantías` : ""}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
