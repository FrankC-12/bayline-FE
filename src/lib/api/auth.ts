import { apiFetch, removeLegacyTokens, settleSessionRefresh } from "./client";
import type { CurrentUser, ModuleAccessLevel, RoleScope } from "@/types/auth";

interface SessionUser {
  user_id: string; email: string; full_name: string; role_id: string; role_slug: string;
  scope: RoleScope; holding_id: string | null; filial_id: string | null;
}

export async function getSessionUser(): Promise<CurrentUser> {
  const user = await apiFetch<SessionUser>("/auth/me");
  return { userId: user.user_id, email: user.email, fullName: user.full_name, roleId: user.role_id,
    roleSlug: user.role_slug, scope: user.scope, holdingId: user.holding_id, filialId: user.filial_id };
}

export async function login(input: { email: string; password: string }): Promise<CurrentUser> {
  await settleSessionRefresh();
  removeLegacyTokens();
  await apiFetch("/auth/login", { method: "POST", body: JSON.stringify(input), auth: false });
  return getSessionUser();
}

export async function logout(): Promise<void> {
  await settleSessionRefresh();
  await apiFetch("/auth/logout", { method: "POST", auth: false });
  removeLegacyTokens();
}

/** The caller's per-module access map — "sin_acceso" can appear explicitly
 * (a per-user override revoking what the role would otherwise grant), a
 * missing key means the same thing. Fetched once by AuthContext and shared
 * app-wide, instead of every screen hitting this endpoint independently. */
export async function getAccessMap(): Promise<Record<string, ModuleAccessLevel>> {
  const result = await apiFetch<{ modules: Record<string, ModuleAccessLevel> }>("/auth/access");
  return result.modules;
}
