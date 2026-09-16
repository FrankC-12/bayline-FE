"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Check, Pencil, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import { useVehicleCatalog } from "@/hooks/useVehicleCatalog";
import type { VehicleBrandOption, VehicleModelOption } from "@/types/vehicleCatalog";
import EmptyState from "@/components/common/EmptyState";
import ActiveToggle from "@/components/common/ActiveToggle";

function ModelRow({
  model,
  canEdit,
  onRename,
  onToggleActive,
}: {
  model: VehicleModelOption;
  canEdit: boolean;
  onRename: (name: string) => Promise<unknown>;
  onToggleActive: () => Promise<unknown>;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(model.name);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);

  async function save() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === model.name) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onRename(trimmed);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function toggle() {
    setToggling(true);
    try {
      await onToggleActive();
    } finally {
      setToggling(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-navy/10 bg-white px-3 py-2 text-sm">
      {editing ? (
        <div className="flex flex-1 items-center gap-2">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") setEditing(false);
            }}
            disabled={saving}
            className="flex-1 rounded-lg border border-navy/15 px-2 py-1 text-sm outline-none focus:border-blue disabled:opacity-60"
          />
          <button
            onClick={save}
            disabled={saving || !name.trim()}
            aria-label="Guardar modelo"
            className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => canEdit && setEditing(true)}
          className={`flex flex-1 items-center gap-1.5 text-left text-navy ${canEdit ? "hover:text-blue" : ""}`}
        >
          {model.name}
          {canEdit && <Pencil className="h-3 w-3 opacity-40" />}
        </button>
      )}
      <ActiveToggle
        isActive={model.is_active}
        disabled={!canEdit || toggling}
        onToggle={toggle}
        label={model.is_active ? `Desactivar ${model.name}` : `Activar ${model.name}`}
      />
    </div>
  );
}

function BrandCard({
  brand,
  canEdit,
  onRename,
  onToggleActive,
  onAddModel,
  onRenameModel,
  onToggleModelActive,
}: {
  brand: VehicleBrandOption;
  canEdit: boolean;
  onRename: (name: string) => Promise<unknown>;
  onToggleActive: () => Promise<unknown>;
  onAddModel: (name: string) => Promise<unknown>;
  onRenameModel: (modelId: string, name: string) => Promise<unknown>;
  onToggleModelActive: (modelId: string, isActive: boolean) => Promise<unknown>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(brand.name);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [newModelName, setNewModelName] = useState("");
  const [addingModel, setAddingModel] = useState(false);

  async function save() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === brand.name) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onRename(trimmed);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function toggle() {
    setToggling(true);
    try {
      await onToggleActive();
    } finally {
      setToggling(false);
    }
  }

  async function handleAddModel() {
    if (!newModelName.trim()) return;
    setAddingModel(true);
    try {
      await onAddModel(newModelName.trim());
      setNewModelName("");
    } finally {
      setAddingModel(false);
    }
  }

  return (
    <div className="rounded-2xl border border-navy/10 bg-white">
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? "Contraer" : "Expandir"}
          className="rounded-lg p-1 text-steel hover:bg-ash"
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>

        {editing ? (
          <div className="flex flex-1 items-center gap-2">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") save();
                if (e.key === "Escape") setEditing(false);
              }}
              disabled={saving}
              className="flex-1 rounded-lg border border-navy/15 px-2 py-1.5 text-sm font-semibold outline-none focus:border-blue disabled:opacity-60"
            />
            <button
              onClick={save}
              disabled={saving || !name.trim()}
              aria-label="Guardar marca"
              className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => canEdit && setEditing(true)}
            className={`flex flex-1 items-center gap-2 text-left font-display font-bold text-navy ${canEdit ? "hover:text-blue" : ""}`}
          >
            {brand.name}
            {canEdit && <Pencil className="h-3.5 w-3.5 opacity-40" />}
          </button>
        )}

        <span className="font-mono text-xs text-steel">
          {brand.models.length} {brand.models.length === 1 ? "modelo" : "modelos"}
        </span>

        <ActiveToggle
          isActive={brand.is_active}
          disabled={!canEdit || toggling}
          onToggle={toggle}
          label={brand.is_active ? `Desactivar ${brand.name}` : `Activar ${brand.name}`}
        />
      </div>

      {expanded && (
        <div className="space-y-2 border-t border-navy/10 bg-ash/40 p-4">
          {brand.models.length === 0 && (
            <p className="px-1 pb-1 text-xs text-steel">Esta marca todavía no tiene modelos cargados.</p>
          )}
          {brand.models.map((model) => (
            <ModelRow
              key={model.id}
              model={model}
              canEdit={canEdit}
              onRename={(newName) => onRenameModel(model.id, newName)}
              onToggleActive={() => onToggleModelActive(model.id, !model.is_active)}
            />
          ))}
          {canEdit && (
            <div className="flex gap-2 rounded-xl border-2 border-dashed border-navy/15 p-2">
              <input
                value={newModelName}
                onChange={(e) => setNewModelName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddModel();
                  }
                }}
                placeholder="Nombre del modelo"
                className="flex-1 rounded-lg bg-white px-2 py-1.5 text-sm outline-none"
              />
              <button
                onClick={handleAddModel}
                disabled={addingModel || !newModelName.trim()}
                className="flex items-center gap-1 rounded-lg bg-blue px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" />
                Agregar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MarcasModelosView() {
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;
  const { canEdit } = useModuleAccess("ajustes");
  const {
    brands,
    loading,
    addBrand,
    editBrand,
    toggleBrandActive,
    addModel,
    editModel,
    toggleModelActive,
  } = useVehicleCatalog(filialId, true);

  const [newBrandName, setNewBrandName] = useState("");
  const [addingBrand, setAddingBrand] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAddBrand() {
    if (!newBrandName.trim()) return;
    setAddingBrand(true);
    setError(null);
    try {
      await addBrand(newBrandName.trim());
      setNewBrandName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo agregar la marca.");
    } finally {
      setAddingBrand(false);
    }
  }

  async function guarded(action: () => Promise<unknown>) {
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el cambio.");
    }
  }

  return (
    <div>
      <p className="text-sm text-steel">
        Catálogo compartido por todo el holding — alimenta las marcas y modelos disponibles en toda la
        aplicación (vehículos de clientes, concesionario, garantías, temparios y planes de mantenimiento).
      </p>
      {!canEdit && (
        <p className="mt-3 rounded-lg bg-ash px-3 py-2 text-xs text-steel">
          Tienes acceso de solo lectura a este catálogo.
        </p>
      )}

      <div className="mt-5 space-y-3">
        {loading ? (
          <div className="rounded-2xl border border-navy/10 bg-white p-12 text-center text-sm text-steel">
            Cargando catálogo...
          </div>
        ) : brands.length === 0 ? (
          <EmptyState title="No hay marcas todavía." description="Agrega la primera marca abajo." />
        ) : (
          brands.map((brand) => (
            <BrandCard
              key={brand.id}
              brand={brand}
              canEdit={canEdit}
              onRename={(name) => guarded(() => editBrand(brand.id, name))}
              onToggleActive={() => guarded(() => toggleBrandActive(brand.id, !brand.is_active))}
              onAddModel={(name) => guarded(() => addModel(brand.id, name))}
              onRenameModel={(modelId, name) => guarded(() => editModel(modelId, name))}
              onToggleModelActive={(modelId, isActive) => guarded(() => toggleModelActive(modelId, isActive))}
            />
          ))
        )}

        {canEdit && (
          <div className="flex gap-2 rounded-2xl border-2 border-dashed border-navy/15 p-3">
            <input
              value={newBrandName}
              onChange={(e) => setNewBrandName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddBrand();
                }
              }}
              placeholder="Nombre de la marca"
              className="flex-1 rounded-lg px-2 py-1.5 text-sm outline-none"
            />
            <button
              onClick={handleAddBrand}
              disabled={addingBrand || !newBrandName.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-blue px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Agregar marca
            </button>
          </div>
        )}

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
