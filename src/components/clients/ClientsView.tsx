"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
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
import LeadFormModal from "./LeadFormModal";
import ClientCard from "./ClientCard";
import ClientDetailModal from "./ClientDetailModal";
import ClientFormPanel from "./ClientFormPanel";

export default function ClientsView() {
  const { currentUser } = useAuth();
  const { canEdit } = useModuleAccess("clientes-vehiculos");
  const { canEdit: canSellVehicles } = useModuleAccess("concesionario");
  const { canEdit: canManageWorkshop } = useModuleAccess("asesor-servicios");
  const canManageLeads = canEdit || canSellVehicles || canManageWorkshop;
  const filialId = currentUser?.filialId ?? null;

  const [lifecycle, setLifecycle] = useState<"todos" | "lead" | "cliente">(
    "todos",
  );
  const [leadOpen, setLeadOpen] = useState(false);
  const [leadTarget, setLeadTarget] = useState<Client | undefined>();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const externalSearch = searchParams.get("search");
  useEffect(() => {
    if (externalSearch !== null) setSearch(externalSearch);
  }, [externalSearch]);
  const settledSearch = useDebouncedValue(search.trim());
  const list = usePagedList<Client>(
    (page, size) =>
      filialId
        ? listClientPage(
            filialId,
            page,
            size,
            settledSearch,
            lifecycle === "todos" ? undefined : lifecycle,
          )
        : Promise.resolve({
            items: [],
            total: 0,
            page: 1,
            page_size: size,
            total_pages: 1,
          }),
    JSON.stringify([currentUser?.userId, filialId, settledSearch, lifecycle]),
  );
  const { items: clients, loading, error, refresh } = list;

  const [detailClient, setDetailClient] = useState<Client | null>(null);
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
      <div className="w-full">
        <p className="text-sm text-steel">
          No se encontró una filial asociada a tu cuenta.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-navy">
          Clientes y vehículos
        </h1>
        <p className="mt-1 text-sm text-steel">
          Abre la información del cliente con un clic. Consulta sus datos y
          vehículos, o elige Editar dentro del modal.
        </p>
      </div>

      <div className="mb-6 rounded-2xl border border-navy/10 bg-white p-4 shadow-sm">
        <ClientsToolbar
          canCreate={canEdit}
          search={search}
          onSearchChange={setSearch}
          onCreateClick={openCreate}
        />
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-full border border-navy/15 bg-white p-1">
          {[
            { value: "todos", label: "Todos" },
            { value: "lead", label: "Leads" },
            { value: "cliente", label: "Clientes" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setLifecycle(tab.value as typeof lifecycle)}
              aria-pressed={lifecycle === tab.value}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${lifecycle === tab.value ? "bg-navy text-white" : "text-steel"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {canManageLeads && (
          <button
            onClick={() => {
              setLeadTarget(undefined);
              setLeadOpen(true);
            }}
            className="rounded-full border border-blue/20 bg-blue-light px-5 py-2.5 text-sm font-semibold text-blue"
          >
            + Nuevo lead
          </button>
        )}
      </div>
      <p role="status" className="mb-4 text-sm text-steel">
        {loading
          ? "Buscando clientes…"
          : `Contactos encontrados: ${list.total} · Vehículos en esta página: ${clients.reduce((count, client) => count + client.vehicles.length, 0)}`}
      </p>

      {loading ? (
        <div className="rounded-2xl border border-navy/10 bg-white p-12 text-center text-sm text-steel">
          Cargando clientes...
        </div>
      ) : error ? (
        <ErrorState error={error} onRetry={refresh} />
      ) : clients.length === 0 ? (
        <EmptyState
          title={
            search
              ? `Sin resultados para "${search}"`
              : "No hay clientes todavía"
          }
          description={
            search
              ? "Prueba con otro término de búsqueda."
              : "Registra un cliente o un lead para comenzar su seguimiento."
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {clients.map((c) => (
            <ClientCard
              key={c.id}
              client={c}
              canEdit={canEdit}
              onClick={() => setDetailClient(c)}
            />
          ))}
        </div>
      )}

      {!loading && !error && <Pagination {...list} />}

      {detailClient && (
        <ClientDetailModal
          client={detailClient}
          onFollowup={() => {
            setLeadTarget(detailClient);
            setDetailClient(null);
            setLeadOpen(true);
          }}
          canEdit={canEdit}
          canManageLead={canManageLeads}
          onClose={() => setDetailClient(null)}
          onEdit={() => {
            const client = detailClient;
            setDetailClient(null);
            openEdit(client);
          }}
        />
      )}

      {leadOpen && canManageLeads && (
        <LeadFormModal
          key={leadTarget?.id || "new"}
          filialId={filialId}
          client={leadTarget}
          onClose={() => setLeadOpen(false)}
          onSaved={(saved) => {
            setLeadOpen(false);
            setDetailClient(saved);
            void refresh();
          }}
        />
      )}
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
