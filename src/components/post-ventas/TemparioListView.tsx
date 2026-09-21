"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTemparios } from "@/hooks/useTemparios";
import { useLaborSettings } from "@/hooks/useLaborSettings";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import TemparioCard from "./TemparioCard";
import CreateTemparioModal from "./CreateTemparioModal";
import type { Tempario } from "@/types/tempario";

export default function TemparioListView() {
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;

  const [search, setSearch] = useState("");
  const { temparios, loading, error, addTempario, editTempario, refresh } = useTemparios(filialId, search || undefined);
  // Editing these settings now lives in the standalone Ajustes module — kept
  // here read-only, just to feed the live price preview below.
  const { settings } = useLaborSettings(filialId);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingTempario, setEditingTempario] = useState<Tempario | null>(null);

  function openCreate() {
    setEditingTempario(null);
    setCreateModalOpen(true);
  }

  function openEdit(tempario: Tempario) {
    setEditingTempario(tempario);
    setCreateModalOpen(true);
  }

  async function handleSubmit(input: Parameters<typeof addTempario>[0]) {
    if (editingTempario) {
      const { category: _omitCategory, filial_id: _omitFilialId, ...rest } = input;
      void _omitCategory;
      void _omitFilialId;
      await editTempario(editingTempario.id, rest);
    } else {
      await addTempario(input);
    }
  }

  if (!filialId) return null;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-navy">Temparios</h1>
          <p className="mt-1 text-sm text-steel">
            Catálogo oficial de servicios · tiempos estándar, repuestos y precio calculado
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-full bg-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy"
          >
            <Plus className="h-4 w-4" />
            Nuevo tempario
          </button>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o código (ej. MP-501, cambio de aceite)..."
          className="w-full rounded-full border border-navy/15 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
        />
      </div>

      <p className="mb-4 text-sm text-steel">
        {temparios.length} servicios en el catálogo. Precio calculado con la tarifa de mano de obra actual.
      </p>

      {loading ? (
        <div className="rounded-2xl border border-navy/10 bg-white p-12 text-center text-sm text-steel">
          Cargando temparios...
        </div>
      ) : error ? (
        <ErrorState error={error} onRetry={refresh} />
      ) : temparios.length === 0 ? (
        <EmptyState
          title={search ? `Sin resultados para "${search}"` : "No hay temparios todavía"}
          description={search ? "Prueba con otro término de búsqueda." : "Crea el primer servicio del catálogo."}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {temparios.map((t) => (
            <TemparioCard key={t.id} tempario={t} onClick={() => openEdit(t)} />
          ))}
        </div>
      )}

      <CreateTemparioModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        filialId={filialId}
        hourlyRate={settings?.hourly_rate ?? 25}
        ivaPercentage={settings?.iva_percentage ?? 16}
        onSubmit={handleSubmit}
        editingTempario={editingTempario}
      />
    </div>
  );
}