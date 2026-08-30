export type RoleScope = "platform" | "holding" | "filial";

export interface CurrentUser {
  userId: string;
  email: string;
  roleId: string;
  roleSlug: string;
  scope: RoleScope;
  holdingId: string | null;
  filialId: string | null;
}