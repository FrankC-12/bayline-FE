"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import type { RoleScope } from "@/types/auth";

const LANDING_BY_SCOPE: Record<RoleScope, string> = {
  platform: "/platform/holdings",
  holding: "/holding/filiales",
  filial: "/dashboard",
};

interface RequireScopeProps {
  scope: RoleScope;
  children: ReactNode;
}

export default function RequireScope({ scope, children }: RequireScopeProps) {
  const { currentUser, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!currentUser) {
      router.replace("/login");
      return;
    }

    if (currentUser.scope !== scope) {
      router.replace(LANDING_BY_SCOPE[currentUser.scope]);
    }
  }, [currentUser, isLoading, scope, router]);

  if (isLoading || !currentUser || currentUser.scope !== scope) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ash">
        <p className="text-sm text-steel">Cargando...</p>
      </div>
    );
  }

  return <>{children}</>;
}