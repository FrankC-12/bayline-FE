"use client";

import { useState } from "react";
import { Pencil, Plus, Power, PowerOff, Search, Upload } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useParts } from "@/hooks/useParts";
import type { Part } from "@/types/parts";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import BulkImportPartsModal from "./BulkImportPartsModal";
import CreatePartModal from "./CreatePartModal";
import PartDetailPanel from "./PartDetailPanel";

function compatibilityLabel(part: Part): string {
  if (!part.vehicle_brand_name) return "Universal";
  const vehicle = [part.vehicle_brand_name, part.vehicle_model_name].filter(Boolean).join(" ");
  const years =
    part.year_from || part.year_to
      ? ` · ${part.year_from ?? "…"}-${part.year_to ?? "…"}`
      : "";
  return `${vehicle}${years}`;
}

export default function PartsCatalogView() {
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const { parts, loading, error: loadError, refresh, addPart, editPart, bulkAddParts, toggleActive } = useParts(
    filialId,
    search || undefined,
    showInactive
  );
  const [panelOpen, setPanelOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewingPart, setViewingPart] = useState<Part | null>(null);
  const [error, setError] = useState<string | null>(null);

  function openCreatePanel() {
    setEditingPart(null);
    setPanelOpen(true);
  }

  function openEditPanel(part: Part) {
    setViewOpen(false);
    setEditingPart(part);
    setPanelOpen(true);
  }

  function openDetailPanel(part: Part) {
    setViewingPart(part);
    setViewOpen(true);
  }

  async function handleToggleActive(part: Part) {
    try {
      await toggleActive(part.id, !part.is_active);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cambiar el estado del repuesto.");
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

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código, nº de parte del fabricante o nombre..."
            className="w-full rounded-full border border-navy/15 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
          />
        </div>
        <label className="flex items-center gap-2 whitespace-nowrap text-sm text-steel">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="h-3.5 w-3.5"
          />
          Mostrar inactivos
        </label>
        <span className="whitespace-nowrap text-sm text-steel">{parts.length} repuestos</span>
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-2xl border border-navy/10 bg-white">
        {loading ? (
          <div className="p-12 text-center text-sm text-steel">Cargando catálogo...</div>
        ) : loadError ? (
          <ErrorState error={loadError} onRetry={refresh} compact />
        ) : parts.length === 0 ? (
          <EmptyState
            compact
            title={search ? `Sin resultados para "${search}"` : "No hay repuestos en el catálogo."}
          />
        ) : (
          <table className="w-full min-w-[1150px] text-left text-sm">
            <thead className="border-b border-navy/10 bg-ash">
              <tr>
                {[
                  "Código",
                  "Nombre",
                  "Categoría",
                  "Compatibilidad",
                  "Ubicación",
                  "Unidad",
                  "Stock mínimo",
                  "Stock total",
                  "Precio de referencia",
                  "Estado",
                  "",
                ].map((heading, index) => (
                  <th
                    key={`${heading}-${index}`}
                    className="whitespace-nowrap px-4 py-3 font-mono text-[11px] uppercase tracking-widest text-steel"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {parts.map((part) => (
                <tr
                  key={part.id}
                  onClick={() => openDetailPanel(part)}
                  className={`cursor-pointer transition hover:bg-ash/60 ${!part.is_active ? "opacity-60" : ""}`}
                >
                  <td className="whitespace-nowrap px-4 py-4">
                    <p className="font-mono text-blue">{part.code}</p>
                    {part.manufacturer_part_number && (
                      <p className="font-mono text-xs text-steel">{part.manufacturer_part_number}</p>
                    )}
                  </td>
                  <td className="px-4 py-4 font-medium text-navy">{part.name}</td>
                  <td className="px-4 py-4 text-navy">{part.category_name}</td>
                  <td className="px-4 py-4 text-navy">{compatibilityLabel(part)}</td>
                  <td className="px-4 py-4 text-navy">{part.location ?? "—"}</td>
                  <td className="px-4 py-4 text-navy">{part.unit}</td>
                  <td className="px-4 py-4 text-navy">{part.min_stock}</td>
                  <td className="px-4 py-4 font-semibold text-navy">{part.stock_total}</td>
                  <td className="whitespace-nowrap px-4 py-4 font-semibold text-navy">
                    {part.reference_price === null
                      ? "Sin costo registrado"
                      : `$${part.reference_price.toFixed(2)}`}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest ${
                        part.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {part.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditPanel(part);
                        }}
                        aria-label={`Editar ${part.name}`}
                        className="rounded-lg p-2 text-steel transition hover:bg-blue-light hover:text-blue"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleActive(part);
                        }}
                        aria-label={part.is_active ? `Desactivar ${part.name}` : `Activar ${part.name}`}
                        className="rounded-lg p-2 text-steel transition hover:bg-blue-light hover:text-blue"
                      >
                        {part.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {filialId && (
        <CreatePartModal
          open={panelOpen}
          onClose={() => setPanelOpen(false)}
          filialId={filialId}
          editingPart={editingPart}
          onCreate={addPart}
          onUpdate={editPart}
          onToggleActive={toggleActive}
        />
      )}

      <PartDetailPanel
        open={viewOpen}
        part={viewingPart}
        onClose={() => setViewOpen(false)}
        onEdit={openEditPanel}
      />

      <BulkImportPartsModal open={bulkOpen} onClose={() => setBulkOpen(false)} onImport={bulkAddParts} />
    </div>
  );
}
