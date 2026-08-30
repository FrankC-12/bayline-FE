"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useFiliales } from "@/hooks/useFiliales";
import type { Filial } from "@/types/filial";
import FilialesToolbar from "./FilialesToolbar";
import FilialesTable from "./FilialesTable";
import CreateFilialPanel from "./CreateFilialPanel";
import CreateFilialUserPanel from "./CreateFilialUserPanel";

export default function FilialesView() {
  const { currentUser } = useAuth();
  const holdingId = currentUser?.holdingId ?? null;
  const { filiales, loading, addFilial, editFilial, toggleActive } = useFiliales(holdingId);

  const [search, setSearch] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingFilial, setEditingFilial] = useState<Filial | null>(null);
  const [creatingUserFor, setCreatingUserFor] = useState<Filial | null>(null);

  const filtered = useMemo(
    () => filiales.filter((f) => f.name.toLowerCase().includes(search.toLowerCase())),
    [filiales, search]
  );

  function openCreate() {
    setEditingFilial(null);
    setPanelOpen(true);
  }

  function openEdit(filial: Filial) {
    setEditingFilial(filial);
    setPanelOpen(true);
  }

  async function handleSubmit(input: { name: string; slug: string }) {
    if (!holdingId) return;
    if (editingFilial) {
      await editFilial(editingFilial.id, input);
    } else {
      await addFilial({ ...input, holding_id: holdingId });
    }
  }

  async function handleToggleActive(filial: Filial) {
    await toggleActive(filial.id, !filial.is_active);
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-8">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-blue">Holding</span>
        <h1 className="mt-2 font-display text-3xl font-bold text-navy">Filiales</h1>
        <p className="mt-1 text-sm text-steel">Administra los talleres y concesionarios de tu holding.</p>
      </div>

      <div className="mb-6">
        <FilialesToolbar search={search} onSearchChange={setSearch} onCreateClick={openCreate} />
      </div>

      <FilialesTable
        filiales={filtered}
        loading={loading}
        onEdit={openEdit}
        onToggleActive={handleToggleActive}
        onCreateUser={(filial) => setCreatingUserFor(filial)}
      />

      <CreateFilialPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onSubmit={handleSubmit}
        editingFilial={editingFilial}
      />

      <CreateFilialUserPanel
        open={creatingUserFor !== null}
        onClose={() => setCreatingUserFor(null)}
        filial={creatingUserFor}
      />
    </div>
  );
}