"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";

export function useModuleAccess(moduleId: string) {
  const [access, setAccess] = useState<"ver" | "editar" | null>(null);
  useEffect(() => {
    let active = true;
    apiFetch<{ modules: Record<string, "ver" | "editar"> }>("/auth/access")
      .then((result) => { if (active) setAccess(result.modules[moduleId] ?? null); })
      .catch(() => { if (active) setAccess(null); });
    return () => { active = false; };
  }, [moduleId]);
  return { access, canEdit: access === "editar" };
}
