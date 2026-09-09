import { apiFetch, removeLegacyTokens, settleSessionRefresh } from "./client";
import type { CurrentUser, RoleScope } from "@/types/auth";

interface SessionUser {
  user_id: string; email: string; role_id: string; role_slug: string;
  scope: RoleScope; holding_id: string | null; filial_id: string | null;
}

export async function getSessionUser(): Promise<CurrentUser> {
  const user = await apiFetch<SessionUser>("/auth/me");
  return { userId: user.user_id, email: user.email, roleId: user.role_id,
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
