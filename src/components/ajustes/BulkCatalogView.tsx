"use client";
import { useEffect, useRef, useState } from "react";
import {
  Download,
  Upload,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import * as XLSX from "xlsx";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import { apiFetch, apiFetchBlob } from "@/lib/api/client";
import { formatCount } from "@/lib/format";
type Template = {
  kind: string;
  columns: string[];
  example: string[];
  options?: Record<string, string[]>;
};
type Review = {
  total: number;
  valid: number;
  errors: { row: number; message: string }[];
  review_hash: string;
  imported: number;
};
const LABELS: Record<string, string> = {
  marcas: "Marcas",
  modelos: "Modelos",
  categorias: "Categorías de repuestos",
  medidas: "Medidas de repuestos",
  entradas: "Motivos de entrada",
  salidas: "Motivos de salida",
  bahias: "Bahías de taller",
  temparios: "Temparios y sus repuestos",
};
export default function BulkCatalogView() {
  const { currentUser } = useAuth();
  const filial = currentUser?.filialId;
  const { canEdit } = useModuleAccess("ajustes");
  const [templates, setTemplates] = useState<Template[]>([]),
    [kind, setKind] = useState("marcas");
  const [rows, setRows] = useState<Record<string, string>[]>([]),
    [filename, setFilename] = useState("");
  const [review, setReview] = useState<Review | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const generation = useRef(0);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    let active = true;
    if (filial)
      apiFetch<Template[]>(`/settings/bulk/templates?filial_id=${filial}`)
        .then((value) => {
          if (active) setTemplates(value);
        })
        .catch((err) => {
          if (active)
            setError(
              err instanceof Error
                ? err.message
                : "No se pudieron cargar las plantillas.",
            );
        });
    return () => {
      active = false;
    };
  }, [filial]);
  useEffect(() => {
    generation.current++;
    setRows([]);
    setFilename("");
    setReview(null);
    setError("");
    if (input.current) input.current.value = "";
  }, [filial, kind]);
  const template = templates.find((item) => item.kind === kind);
  async function download() {
    if (!filial) return;
    setError("");
    try {
      const blob = await apiFetchBlob(
        `/settings/bulk/templates/${kind}?filial_id=${filial}`,
      );
      const url = URL.createObjectURL(blob),
        link = document.createElement("a");
      link.href = url;
      link.download = `plantilla-${kind}.csv`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo descargar.");
    }
  }
  async function read(file: File) {
    const version = ++generation.current;
    setError("");
    setReview(null);
    setRows([]);
    setFilename(file.name);
    setBusy(true);
    try {
      if (file.size > 2 * 1024 * 1024)
        throw new Error("El archivo debe pesar hasta 2 MB.");
      const workbook = XLSX.read(await file.arrayBuffer(), {
        type: "array",
        codepage: 65001,
      });
      if (workbook.SheetNames.length !== 1)
        throw new Error(
          "Usa un archivo de una sola hoja por catálogo para evitar omitir datos.",
        );
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const matrix = XLSX.utils.sheet_to_json<string[]>(sheet, {
        header: 1,
        raw: false,
        defval: "",
        blankrows: false,
      });
      const headers = (matrix.shift() ?? []).map((value) =>
        String(value)
          .replace(/^\uFEFF/, "")
          .trim()
          .toLowerCase(),
      );
      if (
        !headers.length ||
        headers.some((header) => !header) ||
        new Set(headers).size !== headers.length
      )
        throw new Error(
          "El archivo necesita encabezados únicos y sin columnas vacías.",
        );
      const parsed = matrix
        .filter((row) => row.some((value) => String(value).trim()))
        .map((row) =>
          Object.fromEntries(
            headers.map((header, index) => [
              header,
              String(row[index] ?? "").trim(),
            ]),
          ),
        );
      if (!parsed.length || parsed.length > 1000)
        throw new Error("Carga entre 1 y 1.000 filas por archivo.");
      if (version === generation.current) setRows(parsed);
    } catch (err) {
      if (version === generation.current)
        setError(
          err instanceof Error ? err.message : "No se pudo leer el archivo.",
        );
    } finally {
      setBusy(false);
    }
  }
  async function submit(commit: boolean) {
    if (!filial || !rows.length || busy) return;
    setBusy(true);
    setError("");
    const version = generation.current;
    try {
      const result = await apiFetch<Review>(
        `/settings/bulk/${kind}/${commit ? "import" : "preview"}?filial_id=${filial}`,
        {
          method: "POST",
          body: JSON.stringify({
            rows,
            review_hash: commit ? review?.review_hash : undefined,
          }),
        },
      );
      if (version === generation.current) setReview(result);
    } catch (err) {
      if (version === generation.current) {
        setError(
          err instanceof Error ? err.message : "No se pudo procesar la carga.",
        );
        if (commit) setReview(null);
      }
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-5">
      <p className="max-w-3xl text-sm leading-relaxed text-steel">
        Carga los catálogos del concesionario con archivos CSV, TXT o Excel.
        Descarga la plantilla, completa sus columnas y revisa los errores antes
        de confirmar. Usa un archivo por catálogo. Cada archivo se importa
        completo; si hay errores no se guarda ninguna fila.
      </p>
      <ol className="grid gap-3 sm:grid-cols-3">
        {[
          "1. Descargar plantilla",
          "2. Cargar y revisar",
          "3. Confirmar importación",
        ].map((label) => (
          <li
            key={label}
            className="rounded-xl border border-navy/10 bg-white p-4 text-sm font-semibold text-navy"
          >
            {label}
          </li>
        ))}
      </ol>
      <section className="rounded-2xl border border-navy/10 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-end gap-4">
          <label className="min-w-56 flex-1 text-sm font-semibold text-navy">
            Catálogo
            <select
              value={kind}
              disabled={busy}
              onChange={(event) => setKind(event.target.value)}
              className="mt-2 block w-full rounded-xl border border-navy/15 p-3"
            >
              {Object.entries(LABELS).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => void download()}
            disabled={!template || busy}
            className="flex items-center gap-2 rounded-full border border-blue/20 px-5 py-3 text-sm font-semibold text-blue disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Descargar CSV
          </button>
        </div>
        {template && (
          <div className="mt-5 rounded-xl bg-slate-50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-navy">
              Columnas y ejemplo de llenado
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {template.columns.map((column, index) => (
                <div key={column} className="min-w-0">
                  <p className="font-mono text-xs font-semibold text-blue">
                    {column}
                  </p>
                  <p className="mt-1 break-words text-xs text-steel">
                    {template.example[index] || "Opcional / automático"}
                    {template.options?.[column] && (
                      <span className="mt-1 block leading-relaxed">
                        Valores: {template.options[column].join(" · ")}
                      </span>
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-950">
          <strong>Orden recomendado:</strong> marcas → modelos → categorías y
          medidas → repuestos → temparios. Los repuestos se cargan desde{" "}
          <Link href="/dashboard/repuestos" className="font-semibold underline">
            Catálogo de repuestos
          </Link>
          . En temparios, repuestos usa CODIGO:CANTIDAD o
          CODIGO:CANTIDAD:COSTO_ESTIMADO separados por |; compatibilidad usa
          Marca:Modelo. No incluyas precios de venta: el sistema los calcula con
          FIFO, margen, mano de obra e IVA. Los catálogos de
          marcas/modelos/categorías/medidas/motivos se comparten en el holding;
          bahías y temparios pertenecen a la filial actual.
        </div>
        {canEdit && (
          <label
            className={`mt-5 flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-blue/25 bg-blue-light/30 p-7 text-center ${busy ? "pointer-events-none opacity-60" : "hover:bg-blue-light/50"}`}
          >
            <Upload className="h-7 w-7 text-blue" />
            <span className="text-sm font-semibold text-navy">
              {filename || "Selecciona el archivo completado"}
            </span>
            <span className="text-xs text-steel">
              CSV, TXT, XLSX o XLS · hasta 1.000 filas y 2 MB
            </span>
            <input
              ref={input}
              type="file"
              accept=".csv,.txt,.xlsx,.xls"
              disabled={busy}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void read(file);
              }}
              className="max-w-full text-xs"
            />
          </label>
        )}
      </section>
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </p>
      )}
      {!!rows.length && (
        <section className="rounded-2xl border border-navy/10 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-navy">{filename}</h3>
              <p className="mt-1 text-sm text-steel">
                {formatCount(rows.length)} filas listas para revisar
              </p>
            </div>
            <button
              type="button"
              disabled={busy || !!review?.imported}
              onClick={() => void submit(false)}
              className="flex items-center gap-2 rounded-full border border-blue/20 px-5 py-3 text-sm font-semibold text-blue disabled:opacity-50"
            >
              <FileCheck className="h-4 w-4" />
              {busy ? "Procesando…" : "Revisar archivo"}
            </button>
          </div>
          {review && (
            <>
              <div
                role="status"
                className={`mt-4 flex items-center gap-3 rounded-xl p-4 text-sm ${review.errors.length ? "bg-amber-50 text-amber-900" : "bg-emerald-50 text-emerald-900"}`}
              >
                {review.errors.length ? (
                  <AlertTriangle className="h-5 w-5 shrink-0" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                )}
                {review.imported
                  ? `${formatCount(review.imported)} registros importados correctamente.`
                  : `${formatCount(review.valid)} filas válidas · ${formatCount(review.errors.length)} errores`}
              </div>
              {!!review.errors.length && (
                <ul className="mt-4 max-h-72 space-y-2 overflow-y-auto text-sm text-red-800">
                  {review.errors.map((item, i) => (
                    <li key={i} className="rounded-lg bg-red-50 p-3">
                      <strong>Fila {formatCount(item.row)}:</strong>{" "}
                      {item.message}
                    </li>
                  ))}
                </ul>
              )}
              {!review.errors.length && !review.imported && canEdit && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void submit(true)}
                  className="mt-4 rounded-full bg-blue px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {busy
                    ? "Importando…"
                    : `Confirmar carga de ${formatCount(review.valid)} registros`}
                </button>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}
