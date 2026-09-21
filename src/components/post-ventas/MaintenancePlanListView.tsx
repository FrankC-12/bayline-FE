"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMaintenancePlans } from "@/hooks/useMaintenancePlans";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import MaintenancePlanCard from "./MaintenancePlanCard";
import CreateMaintenancePlanModal from "./CreateMaintenancePlanModal";
import type { MaintenancePlan } from "@/types/maintenancePlan";

export default function MaintenancePlanListView() {
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;

  const [search, setSearch] = useState("");
  const { plans, loading, error, addPlan, editPlan, refresh } = useMaintenancePlans(filialId, search || undefined);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MaintenancePlan | null>(null);

  function openCreate() {
    setEditingPlan(null);
    setCreateModalOpen(true);
  }

  function openEdit(plan: MaintenancePlan) {
    setEditingPlan(plan);
    setCreateModalOpen(true);
  }

  async function handleSubmit(input: Parameters<typeof addPlan>[0]) {
    if (editingPlan) {
      const { filial_id: _omitFilialId, ...rest } = input;
      void _omitFilialId;
      await editPlan(editingPlan.id, rest);
    } else {
      await addPlan(input);
    }
  }

  if (!filialId) return null;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-navy">Planes de Mantenimiento</h1>
          <p className="mt-1 text-sm text-steel">
            Planes de fábrica por marca (MPT) · qué servicio toca según kilometraje o tiempo
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-full bg-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy"
        >
          <Plus className="h-4 w-4" />
          Nuevo plan
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por marca o nombre del plan..."
          className="w-full rounded-full border border-navy/15 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
        />
      </div>

      {loading ? (
        <div className="rounded-2xl border border-navy/10 bg-white p-12 text-center text-sm text-steel">
          Cargando planes...
        </div>
      ) : error ? (
        <ErrorState error={error} onRetry={refresh} />
      ) : plans.length === 0 ? (
        <EmptyState
          title={search ? `Sin resultados para "${search}"` : "No hay planes de mantenimiento todavía"}
          description={search ? "Prueba con otro término de búsqueda." : "Crea el primer plan para una marca."}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((p) => (
            <MaintenancePlanCard key={p.id} plan={p} onClick={() => openEdit(p)} />
          ))}
        </div>
      )}

      <CreateMaintenancePlanModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        filialId={filialId}
        onSubmit={handleSubmit}
        editingPlan={editingPlan}
      />
    </div>
  );
}
