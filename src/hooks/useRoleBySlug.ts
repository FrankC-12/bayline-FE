"use client";

import { useEffect, useState } from "react";
import { getRoles } from "@/lib/api/role";
import type { Role } from "@/types/role";

export function useRoleBySlug(slug: string) {
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getRoles().then((roles) => {
      if (active) {
        setRole(roles.find((r) => r.slug === slug) ?? null);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [slug]);

  return { role, loading };
}