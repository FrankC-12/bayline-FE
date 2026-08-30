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