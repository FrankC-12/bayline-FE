"use client";

import { getUsersDirectory } from "@/lib/api/user";
import type { UserDirectoryEntry } from "@/types/user";
import { useListLoader } from "./useListLoader";

interface UseUserDirectoryParams {
  holdingId?: string | null;
  filialId?: string | null;
}

/** For "asignar técnico/asesor" pickers — anything that only needs a user's
 * id/name/role, not the admin-only fields `useUsers` returns. Backed by
 * GET /users/directory, which stays open to any authenticated user. */
export function useUserDirectory(params: UseUserDirectoryParams = {}) {
  const { holdingId, filialId } = params;

  const {
    data: users,
    loading,
    error,
    refresh,
  } = useListLoader<UserDirectoryEntry>(
    () =>
      getUsersDirectory({
        holding_id: holdingId ?? undefined,
        filial_id: filialId ?? undefined,
      }),
    [holdingId, filialId]
  );

  return { users, loading, error, refresh };
}
