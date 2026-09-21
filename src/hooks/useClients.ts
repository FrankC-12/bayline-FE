"use client";

import { useCallback } from "react";
import {
  listClients,
  createClient,
  updateClient,
  type CreateClientInput,
  type UpdateClientInput,
} from "@/lib/api/clients";
import type { Client } from "@/types/client";
import { useListLoader } from "./useListLoader";

export function useClients(filialId: string | null, search?: string) {
  const {
    data: clients,
    setData: setClients,
    loading,
    error,
    refresh,
  } = useListLoader<Client>(() => (filialId ? listClients(filialId, search) : Promise.resolve([])), [filialId, search]);

  const addClient = useCallback(
    async (input: CreateClientInput) => {
      const created = await createClient(input);
      setClients((prev) => [created, ...prev]);
      return created;
    },
    [setClients]
  );

  const editClient = useCallback(
    async (id: string, input: UpdateClientInput) => {
      const updated = await updateClient(id, input);
      setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      return updated;
    },
    [setClients]
  );

  return { clients, loading, error, addClient, editClient, refresh };
}
