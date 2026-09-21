import type { RoleScope } from "./auth";

export type AccessLevel = "ver" | "editar" | "sin_acceso";

export interface ModulePermission {
  module_id: string;
  access: AccessLevel;
}

export interface Role {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  scope: RoleScope;
  permissions: ModulePermission[];
  created_at: string;
  updated_at: string;
}

/** Minimal id/name/slug/scope shape for role-picker dropdowns — see
 * GET /roles/directory, which any authenticated user can read (unlike
 * Role's `permissions`, which is admin-only). */
export interface RoleDirectoryEntry {
  id: string;
  name: string;
  slug: string;
  scope: RoleScope;
}