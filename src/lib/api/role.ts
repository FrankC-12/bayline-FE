import { apiFetch } from "./client";
import type { Role } from "@/types/role";
import type { RoleScope } from "@/types/auth";

export async function getRoles(scope?: RoleScope): Promise<Role[]> {
  const query = scope ? `?scope=${scope}` : "";
  return apiFetch<Role[]>(`/roles${query}`);
}

export async function getRole(id: string): Promise<Role> {
  return apiFetch<Role>(`/roles/${id}`);
}