"use client";

import { useState } from "react";
import { Plus, Search, Upload } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useParts } from "@/hooks/useParts";
import { formatCount } from "@/lib/format";
import PartCatalogCard from "./PartCatalogCard";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import type { Part } from "@/types/parts";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import BulkImportPartsModal from "./BulkImportPartsModal";
import CreatePartModal from "./CreatePartModal";
import PartDetailPanel from "./PartDetailPanel";

export default function PartsCatalogView() {
  const { currentUser } = useAuth();
  const { canEdit } = useModuleAccess("repuestos");
  const [busyPartId, setBusyPartId] = useState<string | null>(null);
  const filialId = currentUser?.filialId ?? null;
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const {
    parts,
    loading,
    error: loadError,
    refresh,
    addPart,
    editPart,
    bulkAddParts,
    toggleActive,
  } = useParts(filialId, search || undefined, showInactive);
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
    if (busyPartId) return;
    setBusyPartId(part.id);
    setError(null);
    try {
      await toggleActive(part.id, !part.is_active);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cambiar el estado del repuesto.",
      );
    } finally {
      setBusyPartId(null);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-navy">
            Catálogo de Repuestos
          </h1>
          <p className="mt-1 text-sm text-steel">
            Consulta precios, existencias y compatibilidad de cada repuesto.
          </p>
        </div>
        {canEdit && (
          <div className="flex flex-wrap gap-2">
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
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Buscar repuestos"
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
        <span className="whitespace-nowrap text-sm text-steel">
          {formatCount(parts.length)}{" "}
          {parts.length === 1 ? "repuesto" : "repuestos"}
        </span>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {loading ? (
        <div
          role="status"
          aria-label="Cargando catálogo"
          className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
        >
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              aria-hidden="true"
              className="overflow-hidden rounded-2xl border border-navy/10 bg-white"
            >
              <div className="h-44 animate-pulse bg-slate-100" />
              <div className="space-y-4 p-5">
                <div className="h-4 w-1/3 animate-pulse rounded bg-slate-100" />
                <div className="h-6 w-3/4 animate-pulse rounded bg-slate-100" />
                <div className="h-8 w-1/2 animate-pulse rounded bg-slate-100" />
                <div className="h-20 animate-pulse rounded bg-slate-50" />
              </div>
            </div>
          ))}
        </div>
      ) : loadError ? (
        <ErrorState error={loadError} onRetry={refresh} compact />
      ) : !parts.length ? (
        <div className="rounded-2xl border border-navy/10 bg-white">
          <EmptyState
            compact
            title={
              search
                ? `Sin resultados para "${search}"`
                : "No hay repuestos en el catálogo."
            }
          />
        </div>
      ) : (
        <div
          aria-label="Catálogo de repuestos"
          className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3"
        >
          {parts.map((part) => (
            <PartCatalogCard
              key={part.id}
              part={part}
              canEdit={canEdit}
              busy={busyPartId === part.id}
              onView={openDetailPanel}
              onEdit={openEditPanel}
              onToggle={(part) => void handleToggleActive(part)}
            />
          ))}
        </div>
      )}

      {filialId && (
        <CreatePartModal
          open={panelOpen}
          onClose={() => setPanelOpen(false)}
          filialId={filialId}
          editingPart={editingPart}
          onCreate={addPart}
          onUpdate={editPart}
          onToggleActive={toggleActive}
          onSaved={() => void refresh()}
        />
      )}

      <PartDetailPanel
        open={viewOpen}
        part={viewingPart}
        onClose={() => setViewOpen(false)}
        onEdit={openEditPanel}
        onUpdated={(part) => {
          setViewingPart(part);
          void refresh();
        }}
      />

      <BulkImportPartsModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onImport={bulkAddParts}
      />
    </div>
  );
}
