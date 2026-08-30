"use client";

import { useRoles } from "./useRoles";
import type { RoleScope } from "@/types/auth";

/** Convenience hook for screens that just need "the" role for a given scope
 * (Platform and Holding only ever have one role each in the catalog). */
export function useRoleByScope(scope: RoleScope) {
  const { roles, loading } = useRoles(scope);
  return { role: roles[0] ?? null, loading };
}