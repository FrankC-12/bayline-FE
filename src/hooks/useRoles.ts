"use client";

import { getRoles } from "@/lib/api/role";
import type { Role } from "@/types/role";
import type { RoleScope } from "@/types/auth";
import { useListLoader } from "./useListLoader";

export function useRoles(scope?: RoleScope) {
  const {
    data: roles,
    loading,
    error,
    refresh,
  } = useListLoader<Role>(() => getRoles(scope), [scope]);

  return { roles, loading, error, refresh };
}