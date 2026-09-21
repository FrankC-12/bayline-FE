"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AccessDenied from "./AccessDenied";

interface RequireModuleAccessProps {
  moduleId: string;
  children: ReactNode;
}

/** Gates an entire module's routes (mount this in that module's
 * `layout.tsx`, not per-page) behind the caller's per-module permission.
 * Only filial-scoped users have per-module permissions at all — a
 * holding/platform caller who somehow lands here is left to that page's
 * own RequireScope to redirect, not shown a denial screen that isn't
 * really about them. */
export default function RequireModuleAccess({ moduleId, children }: RequireModuleAccessProps) {
  const { currentUser, isLoading, accessLoading, hasModuleAccess } = useAuth();

  if (isLoading || (currentUser?.scope === "filial" && accessLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ash">
        <p className="text-sm text-steel">Cargando...</p>
      </div>
    );
  }

  if (currentUser?.scope === "filial" && !hasModuleAccess(moduleId)) {
    return <AccessDenied />;
  }

  return <>{children}</>;
}
