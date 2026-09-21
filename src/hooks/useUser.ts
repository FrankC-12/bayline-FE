"use client";

import { useCallback } from "react";
import {
  getUsers,
  createUser,
  updateUser,
  type CreateUserInput,
  type UpdateUserInput,
} from "@/lib/api/user";
import type { AppUser } from "@/types/user";
import { useListLoader } from "./useListLoader";

interface UseUsersParams {
  holdingId?: string | null;
  filialId?: string | null;
}

export function useUsers(params: UseUsersParams = {}) {
  const { holdingId, filialId } = params;

  const {
    data: users,
    setData: setUsers,
    loading,
    error,
    refresh,
  } = useListLoader<AppUser>(
    () =>
      getUsers({
        holding_id: holdingId ?? undefined,
        filial_id: filialId ?? undefined,
      }),
    [holdingId, filialId]
  );

  const addUser = useCallback(
    async (input: CreateUserInput) => {
      const created = await createUser(input);
      setUsers((prev) => [created, ...prev]);
      return created;
    },
    [setUsers]
  );

  const editUser = useCallback(
    async (id: string, input: UpdateUserInput) => {
      const updated = await updateUser(id, input);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      return updated;
    },
    [setUsers]
  );

  return { users, loading, error, addUser, editUser, refresh };
}
