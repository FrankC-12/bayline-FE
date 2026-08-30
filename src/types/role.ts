import type { RoleScope } from "./auth";

export type AccessLevel = "ver" | "editar";

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