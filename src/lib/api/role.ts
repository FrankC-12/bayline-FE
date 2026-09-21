import { apiFetch } from "./client";
import type { Role, RoleDirectoryEntry } from "@/types/role";
import type { RoleScope } from "@/types/auth";

export async function getRoles(scope?: RoleScope): Promise<Role[]> {
  const query = scope ? `?scope=${scope}` : "";
  return apiFetch<Role[]>(`/roles${query}`);
}

export async function getRole(id: string): Promise<Role> {
  return apiFetch<Role>(`/roles/${id}`);
}

export async function getRolesDirectory(scope?: RoleScope): Promise<RoleDirectoryEntry[]> {
  const query = scope ? `?scope=${scope}` : "";
  return apiFetch<RoleDirectoryEntry[]>(`/roles/directory${query}`);
}