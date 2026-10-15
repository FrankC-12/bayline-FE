"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import { useAuth } from "@/contexts/AuthContext";
import { usePagedList } from "@/hooks/usePagedList";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import Pagination from "@/components/common/Pagination";
import { listClientPage, createClient, updateClient } from "@/lib/api/clients";
import type { Client } from "@/types/client";
import type { CreateClientInput } from "@/lib/api/clients";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import ClientsToolbar from "./ClientToolbar";
import ClientCard from "./ClientCard";
import ClientDetailModal from "./ClientDetailModal";
import ClientFormPanel from "./ClientFormPanel";

export default function ClientsView() {
  const { currentUser } = useAuth();
  const { canEdit } = useModuleAccess("clientes-vehiculos");
  const filialId = currentUser?.filialId ?? null;

  const [search, setSearch] = useState("");
  const settledSearch = useDebouncedValue(search.trim());
  const list = usePagedList<Client>((page, size) => filialId ? listClientPage(filialId, page, size, settledSearch)
    : Promise.resolve({items: [], total: 0, page: 1, page_size: size, total_pages: 1}), JSON.stringify([currentUser?.userId, filialId, settledSearch]));
  const {items: clients, loading, error, refresh} = list;

  const [detailClient,setDetailClient]=useState<Client | null>(null);
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
      const { filial_id: _omitFilialId, ...rest } = input;
      void _omitFilialId;
      await updateClient(editingClient.id, rest);
    } else {
      await createClient(input);
    }
    await refresh();
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
        <h1 className="font-display text-3xl font-bold text-navy">Clientes y vehículos</h1>
        <p className="mt-1 text-sm text-steel">
          Abre la información del cliente con un clic. Consulta sus datos y vehículos, o elige Editar dentro del modal.
        </p>
      </div>

      <div className="mb-6 rounded-2xl border border-navy/10 bg-white p-4 shadow-sm">
        <ClientsToolbar canCreate={canEdit} search={search} onSearchChange={setSearch} onCreateClick={openCreate} />
      </div>

      <p role="status" className="mb-4 text-sm text-steel">{loading ? "Buscando clientes…" : `Clientes encontrados: ${list.total} · Vehículos en esta página: ${clients.reduce((count,client)=>count+client.vehicles.length,0)}`}</p>

      {loading ? (
        <div className="rounded-2xl border border-navy/10 bg-white p-12 text-center text-sm text-steel">
          Cargando clientes...
        </div>
      ) : error ? (
        <ErrorState error={error} onRetry={refresh} />
      ) : clients.length === 0 ? (
        <EmptyState
          title={search ? `Sin resultados para "${search}"` : "No hay clientes todavía"}
          description={search ? "Prueba con otro término de búsqueda." : "Registra el primer cliente de tu filial."}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((c) => (
            <ClientCard key={c.id} client={c} canEdit={canEdit} onClick={() => setDetailClient(c)} />
          ))}
        </div>
      )}

      {!loading && !error && <Pagination {...list} />}

      {detailClient && <ClientDetailModal client={detailClient} canEdit={canEdit} onClose={()=>setDetailClient(null)} onEdit={()=>{const client=detailClient;setDetailClient(null);openEdit(client);}}/>}

      <ClientFormPanel
        readOnly={!canEdit}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        filialId={filialId}
        onSubmit={handleSubmit}
        editingClient={editingClient}
      />
    </div>
  );
}