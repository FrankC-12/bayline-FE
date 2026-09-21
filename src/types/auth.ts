export type RoleScope = "platform" | "holding" | "filial";
export type ModuleAccessLevel = "ver" | "editar" | "sin_acceso";

export interface CurrentUser {
  userId: string;
  email: string;
  fullName: string;
  roleId: string;
  roleSlug: string;
  scope: RoleScope;
  holdingId: string | null;
  filialId: string | null;
}