"use client";

import { useState } from "react";
import { Loader2, Pencil, Plus, Search, Upload, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useParts } from "@/hooks/useParts";
import type { Part } from "@/types/parts";
import BulkImportPartsModal from "./BulkImportPartsModal";

interface PartForm {
  code: string;
  name: string;
  category: string;
  brand: string;
  application: string;
  unit: string;
}

const EMPTY_FORM: PartForm = {
  code: "",
  name: "",
  category: "",
  brand: "",
  application: "",
  unit: "",
};

export default function PartsCatalogView() {
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;
  const [search, setSearch] = useState("");
  const { parts, loading, addPart, editPart, bulkAddParts } = useParts(
    filialId,
    search || undefined
  );
  const [panelOpen, setPanelOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PartForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateField(field: keyof PartForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function openCreatePanel() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
    setPanelOpen(true);
  }

  function openEditPanel(part: Part) {
    setEditingId(part.id);
    setForm({
      code: part.code,
      name: part.name,
      category: part.category,
      brand: part.brand,
      application: part.application,
      unit: part.unit,
    });
    setError(null);
    setPanelOpen(true);
  }

  function closePanel() {
    setPanelOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!filialId) return;
    const payload = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, value.trim()])
    ) as unknown as PartForm;
    if (Object.values(payload).some((value) => !value)) return;

    setSubmitting(true);
    setError(null);
    try {
      if (editingId) await editPart(editingId, payload);
      else await addPart({ filial_id: filialId, ...payload });
      closePanel();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el repuesto.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-navy">Catálogo de Repuestos</h1>
          <p className="mt-1 text-sm text-steel">
            Datos maestros; el stock y el precio se calculan desde los almacenes
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setBulkOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-navy/15 px-5 py-2.5 text-sm font-semibold text-navy transition hover:border-navy/40"
          >
            <Upload className="h-4 w-4" /> Carga masiva
          </button>
          <button
            onClick={openCreatePanel}
            className="inline-flex items-center gap-2 rounded-full bg-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy"
          >
            <Plus className="h-4 w-4" /> Nuevo repuesto
          </button>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código o nombre de repuesto..."
            className="w-full rounded-full border border-navy/15 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
          />
        </div>
        <span className="whitespace-nowrap text-sm text-steel">{parts.length} repuestos</span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-navy/10 bg-white">
        {loading ? (
          <div className="p-12 text-center text-sm text-steel">Cargando catálogo...</div>
        ) : parts.length === 0 ? (
          <div className="p-12 text-center text-sm text-steel">No hay repuestos en el catálogo.</div>
        ) : (
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead className="border-b border-navy/10 bg-ash">
              <tr>
                {["Código", "Nombre", "Categoría", "Marca", "Aplicación", "Unidad", "Stock total", "Precio de referencia", ""].map(
                  (heading, index) => (
                    <th
                      key={`${heading}-${index}`}
                      className="whitespace-nowrap px-4 py-3 font-mono text-[11px] uppercase tracking-widest text-steel"
                    >
                      {heading}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {parts.map((part) => (
                <tr key={part.id} className="transition hover:bg-ash/60">
                  <td className="whitespace-nowrap px-4 py-4 font-mono text-blue">{part.code}</td>
                  <td className="px-4 py-4 font-medium text-navy">{part.name}</td>
                  <td className="px-4 py-4 text-navy">{part.category}</td>
                  <td className="px-4 py-4 text-navy">{part.brand}</td>
                  <td className="px-4 py-4 text-navy">{part.application}</td>
                  <td className="px-4 py-4 text-navy">{part.unit}</td>
                  <td className="px-4 py-4 font-semibold text-navy">{part.stock_total}</td>
                  <td className="whitespace-nowrap px-4 py-4 font-semibold text-navy">
                    {part.reference_price === null
                      ? "Sin costo registrado"
                      : `$${part.reference_price.toFixed(2)}`}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button
                      onClick={() => openEditPanel(part)}
                      aria-label={`Editar ${part.name}`}
                      className="rounded-lg p-2 text-steel transition hover:bg-blue-light hover:text-blue"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div
        className={`fixed inset-0 z-50 transition ${panelOpen ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!panelOpen}
      >
        <div
          onClick={closePanel}
          className={`absolute inset-0 bg-navy/40 transition-opacity ${panelOpen ? "opacity-100" : "opacity-0"}`}
        />
        <aside
          className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ${panelOpen ? "translate-x-0" : "translate-x-full"}`}
        >
          <div className="flex items-center justify-between border-b border-navy/10 px-8 py-5">
            <h2 className="font-display text-xl font-bold text-navy">
              {editingId ? "Editar repuesto" : "Nuevo repuesto"}
            </h2>
            <button onClick={closePanel} aria-label="Cerrar" className="rounded-lg p-2 text-steel hover:bg-ash hover:text-navy">
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="flex-1 space-y-5 overflow-y-auto p-8">
            {([
              ["code", "Código", "08880-83840"],
              ["name", "Nombre", "Aceite motor 5W-30"],
              ["category", "Categoría", "Lubricantes"],
              ["brand", "Marca", "Toyota"],
              ["application", "Aplicación", "Hilux 2018-2025"],
              ["unit", "Unidad", "Litro"],
            ] as const).map(([field, label, placeholder]) => (
              <div key={field}>
                <label className="mb-1.5 block text-sm font-medium text-navy">{label}</label>
                <input
                  required
                  value={form[field]}
                  onChange={(e) => updateField(field, e.target.value)}
                  placeholder={placeholder}
                  className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
                />
              </div>
            ))}
            <p className="text-xs text-steel">
              El stock y el precio de referencia se calculan automáticamente desde los lotes de
              almacén y no se editan en el catálogo.
            </p>
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingId ? "Guardar cambios" : "Crear repuesto"}
            </button>
          </form>
        </aside>
      </div>

      <BulkImportPartsModal open={bulkOpen} onClose={() => setBulkOpen(false)} onImport={bulkAddParts} />
    </div>
  );
}
