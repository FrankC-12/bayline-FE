"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listClients,
  createClient,
  updateClient,
  type CreateClientInput,
  type UpdateClientInput,
} from "@/lib/api/clients";
import type { Client } from "@/types/client";

export function useClients(filialId: string | null, search?: string) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!filialId) {
      setClients([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await listClients(filialId, search);
    setClients(data);
    setLoading(false);
  }, [filialId, search]);

  useEffect(() => {
    load();
  }, [load]);

  const addClient = useCallback(async (input: CreateClientInput) => {
    const created = await createClient(input);
    setClients((prev) => [created, ...prev]);
    return created;
  }, []);

  const editClient = useCallback(async (id: string, input: UpdateClientInput) => {
    const updated = await updateClient(id, input);
    setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    return updated;
  }, []);

  return { clients, loading, addClient, editClient, refresh: load };
}