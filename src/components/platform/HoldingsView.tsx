"use client";

import { useMemo, useState } from "react";
import { useHoldings } from "@/hooks/useHoldings";
import type { Holding } from "@/types/holding";
import type { CreateHoldingInput } from "@/lib/api/holding";
import HoldingsToolbar from "./HoldingsToolbar";
import HoldingsTable from "./HoldingsTable";
import CreateHoldingPanel from "./CreateHoldingPanel";
import CreateHoldingUserPanel from "./CreateHoldingUserPanel";

export default function HoldingsView() {
  const {
    holdings,
    loading,
    error,
    addHolding,
    editHolding,
    toggleActive,
    refresh,
  } = useHoldings();
  const [search, setSearch] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingHolding, setEditingHolding] = useState<Holding | null>(null);
  const [creatingUserFor, setCreatingUserFor] = useState<Holding | null>(null);

  const filtered = useMemo(
    () =>
      holdings.filter((h) =>
        h.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [holdings, search],
  );

  function openCreate() {
    setEditingHolding(null);
    setPanelOpen(true);
  }

  function openEdit(holding: Holding) {
    setEditingHolding(holding);
    setPanelOpen(true);
  }

  async function handleSubmit(input: CreateHoldingInput) {
    if (editingHolding) {
      await editHolding(editingHolding.id, input);
    } else {
      await addHolding(input);
    }
  }

  async function handleToggleActive(holding: Holding) {
    await toggleActive(holding.id, !holding.is_active);
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-8">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-blue">
          Motrix · Administración de plataforma
        </span>
        <h1 className="mt-2 font-display text-3xl font-bold text-navy">
          Holdings
        </h1>
        <p className="mt-1 text-sm text-steel">
          Da de alta grupos empresariales, administra su acceso y crea sus
          usuarios responsables.
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Holdings registrados", value: holdings.length },
          {
            label: "Activos",
            value: holdings.filter((h) => h.is_active).length,
          },
          {
            label: "Inactivos",
            value: holdings.filter((h) => !h.is_active).length,
          },
        ].map((item) => (
          <article
            key={item.label}
            className="rounded-2xl border border-navy/10 bg-white p-5"
          >
            <p className="text-sm text-steel">{item.label}</p>
            <p className="mt-2 font-display text-2xl font-bold text-navy">
              {item.value}
            </p>
          </article>
        ))}
      </div>
      <div className="mb-6">
        <HoldingsToolbar
          search={search}
          onSearchChange={setSearch}
          onCreateClick={openCreate}
        />
      </div>

      <HoldingsTable
        holdings={filtered}
        loading={loading}
        error={error}
        onRetry={refresh}
        onEdit={openEdit}
        onToggleActive={handleToggleActive}
        onCreateUser={(holding) => setCreatingUserFor(holding)}
      />

      <CreateHoldingPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onSubmit={handleSubmit}
        editingHolding={editingHolding}
      />

      <CreateHoldingUserPanel
        open={creatingUserFor !== null}
        onClose={() => setCreatingUserFor(null)}
        holding={creatingUserFor}
      />
    </div>
  );
}
