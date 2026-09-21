import type { ModulePermission } from "./role";

export type UserStatus = "activo" | "invitado" | "inactivo";

export interface AppUser {
  id: string;
  full_name: string;
  email: string;
  status: UserStatus;
  role_id: string;
  holding_id: string | null;
  filial_id: string | null;
  permission_overrides: ModulePermission[];
  created_at: string;
  updated_at: string;
}

/** Minimal id/name/role shape for "asignar técnico/asesor" pickers — see
 * GET /users/directory, which any authenticated user can read (unlike
 * AppUser's email/permission_overrides, which are admin-only). */
export interface UserDirectoryEntry {
  id: string;
  full_name: string;
  role_id: string;
}