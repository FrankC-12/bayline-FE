"use client";

import { useState } from "react";
import { Check, Pencil, Plus } from "lucide-react";
import ActiveToggle from "@/components/common/ActiveToggle";
import EmptyState from "@/components/common/EmptyState";

interface CatalogItem {
  id: string;
  name: string;
  is_active: boolean;
}

interface SimpleCatalogRowProps {
  item: CatalogItem;
  canEdit: boolean;
  onRename: (name: string) => Promise<unknown>;
  onToggleActive: () => Promise<unknown>;
}

function SimpleCatalogRow({ item, canEdit, onRename, onToggleActive }: SimpleCatalogRowProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);

  async function save() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === item.name) {
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
    <div className="flex items-center justify-between gap-2 rounded-xl border border-navy/10 bg-white px-4 py-3">
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
            aria-label="Guardar"
            className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => canEdit && setEditing(true)}
          className={`flex flex-1 items-center gap-2 text-left font-medium text-navy ${canEdit ? "hover:text-blue" : ""}`}
        >
          {item.name}
          {canEdit && <Pencil className="h-3.5 w-3.5 opacity-40" />}
        </button>
      )}
      <ActiveToggle
        isActive={item.is_active}
        disabled={!canEdit || toggling}
        onToggle={toggle}
        label={item.is_active ? `Desactivar ${item.name}` : `Activar ${item.name}`}
      />
    </div>
  );
}

interface SimpleCatalogViewProps {
  description: string;
  items: CatalogItem[];
  loading: boolean;
  canEdit: boolean;
  addPlaceholder: string;
  addButtonLabel: string;
  emptyTitle: string;
  onAdd: (name: string) => Promise<unknown>;
  onRename: (id: string, name: string) => Promise<unknown>;
  onToggleActive: (id: string, isActive: boolean) => Promise<unknown>;
}

/** Flat, holding-wide named catalog with inline rename and activate/deactivate
 * — used for both Categorías and Medidas de Repuestos in Ajustes. */
export default function SimpleCatalogView({
  description,
  items,
  loading,
  canEdit,
  addPlaceholder,
  addButtonLabel,
  emptyTitle,
  onAdd,
  onRename,
  onToggleActive,
}: SimpleCatalogViewProps) {
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    if (!newName.trim()) return;
    setAdding(true);
    setError(null);
    try {
      await onAdd(newName.trim());
      setNewName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo agregar.");
    } finally {
      setAdding(false);
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
      <p className="text-sm text-steel">{description}</p>
      {!canEdit && (
        <p className="mt-3 rounded-lg bg-ash px-3 py-2 text-xs text-steel">
          Tienes acceso de solo lectura a este catálogo.
        </p>
      )}

      <div className="mt-5 space-y-2">
        {loading ? (
          <div className="rounded-2xl border border-navy/10 bg-white p-12 text-center text-sm text-steel">
            Cargando catálogo...
          </div>
        ) : items.length === 0 ? (
          <EmptyState title={emptyTitle} description="Agrega el primero abajo." />
        ) : (
          items.map((item) => (
            <SimpleCatalogRow
              key={item.id}
              item={item}
              canEdit={canEdit}
              onRename={(name) => guarded(() => onRename(item.id, name))}
              onToggleActive={() => guarded(() => onToggleActive(item.id, !item.is_active))}
            />
          ))
        )}

        {canEdit && (
          <div className="flex gap-2 rounded-2xl border-2 border-dashed border-navy/15 p-3">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAdd();
                }
              }}
              placeholder={addPlaceholder}
              className="flex-1 rounded-lg px-2 py-1.5 text-sm outline-none"
            />
            <button
              onClick={handleAdd}
              disabled={adding || !newName.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-blue px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {addButtonLabel}
            </button>
          </div>
        )}

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
