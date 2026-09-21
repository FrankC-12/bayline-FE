"use client";

import { getRolesDirectory } from "@/lib/api/role";
import type { RoleDirectoryEntry } from "@/types/role";
import type { RoleScope } from "@/types/auth";
import { useListLoader } from "./useListLoader";

/** For role-picker dropdowns (assigning a técnico, filtering Calendario by
 * role, etc.) — anything that only needs a role's id/name/slug/scope, not
 * the admin-only permission matrix `useRoles` returns. Backed by
 * GET /roles/directory, which stays open to any authenticated user. */
export function useRoleDirectory(scope?: RoleScope) {
  const {
    data: roles,
    loading,
    error,
    refresh,
  } = useListLoader<RoleDirectoryEntry>(() => getRolesDirectory(scope), [scope]);

  return { roles, loading, error, refresh };
}
