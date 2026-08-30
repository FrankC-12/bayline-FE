"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useClients } from "@/hooks/useClients";
import type { Client } from "@/types/client";
import type { CreateClientInput } from "@/lib/api/clients";
import ClientsToolbar from "./ClientToolbar";
import ClientCard from "./ClientCard";
import ClientFormPanel from "./ClientFormPanel";

export default function ClientsView() {
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;

  const [search, setSearch] = useState("");
  const { clients, loading, addClient, editClient } = useClients(filialId, search || undefined);

  const [panelOpen, setPanelOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  function openCreate() {
    setEditingClient(null);
    setPanelOpen(true);
  }

  function openEdit(client: Client) {
    setEditingClient(client);
    setPanelOpen(true);
  }

  async function handleSubmit(input: CreateClientInput) {
    if (editingClient) {
      const { filial_id: _filialId, ...rest } = input;
      await editClient(editingClient.id, rest);
    } else {
      await addClient(input);
    }
  }

  if (!filialId) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-12">
        <p className="text-sm text-steel">No se encontró una filial asociada a tu cuenta.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-steel hover:text-navy"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver al Dashboard
      </Link>

      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-navy">Clientes</h1>
        <p className="mt-1 text-sm text-steel">
          Base de datos compartida de clientes y vehículos de tu filial.
        </p>
      </div>

      <div className="mb-6">
        <ClientsToolbar search={search} onSearchChange={setSearch} onCreateClick={openCreate} />
      </div>

      {loading ? (
        <div className="rounded-2xl border border-navy/10 bg-white p-12 text-center text-sm text-steel">
          Cargando clientes...
        </div>
      ) : clients.length === 0 ? (
        <div className="rounded-2xl border border-navy/10 bg-white p-12 text-center">
          <p className="font-display text-lg font-bold text-navy">No hay clientes todavía</p>
          <p className="mt-1 text-sm text-steel">Registra el primer cliente de tu filial.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((c) => (
            <ClientCard key={c.id} client={c} onClick={() => openEdit(c)} />
          ))}
        </div>
      )}

      <ClientFormPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        filialId={filialId}
        onSubmit={handleSubmit}
        editingClient={editingClient}
      />
    </div>
  );
}