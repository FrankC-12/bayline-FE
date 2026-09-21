"use client";

import { useAuth } from "@/contexts/AuthContext";

/** Thin wrapper over AuthContext's shared access map — kept for the
 * existing call sites' sake (same {access, canEdit} shape as before), but
 * no longer fetches anything itself. */
export function useModuleAccess(moduleId: string) {
  const { accessMap, accessLoading, canEditModule } = useAuth();
  const level = accessMap[moduleId];
  const access = level === "ver" || level === "editar" ? level : null;
  return { access, canEdit: canEditModule(moduleId), loading: accessLoading };
}
