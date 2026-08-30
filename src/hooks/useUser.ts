"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getUsers,
  createUser,
  updateUser,
  type CreateUserInput,
  type UpdateUserInput,
} from "@/lib/api/user";
import type { AppUser } from "@/types/user";

interface UseUsersParams {
  holdingId?: string | null;
  filialId?: string | null;
}

export function useUsers(params: UseUsersParams = {}) {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getUsers({
      holding_id: params.holdingId ?? undefined,
      filial_id: params.filialId ?? undefined,
    });
    setUsers(data);
    setLoading(false);
  }, [params.holdingId, params.filialId]);

  useEffect(() => {
    load();
  }, [load]);

  const addUser = useCallback(async (input: CreateUserInput) => {
    const created = await createUser(input);
    setUsers((prev) => [created, ...prev]);
    return created;
  }, []);

  const editUser = useCallback(async (id: string, input: UpdateUserInput) => {
    const updated = await updateUser(id, input);
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    return updated;
  }, []);

  return { users, loading, addUser, editUser, refresh: load };
}