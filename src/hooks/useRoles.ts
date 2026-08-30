"use client";

import { useEffect, useState } from "react";
import { getRoles } from "@/lib/api/role";
import type { Role } from "@/types/role";
import type { RoleScope } from "@/types/auth";

export function useRoles(scope?: RoleScope) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getRoles(scope).then((data) => {
      if (active) {
        setRoles(data);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [scope]);

  return { roles, loading };
}