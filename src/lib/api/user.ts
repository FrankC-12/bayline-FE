import { apiFetch } from "./client";
import type { AppUser, UserStatus } from "@/types/user";
import type { ModulePermission } from "@/types/role";

export interface CreateUserInput {
  full_name: string;
  email: string;
  role_id: string;
  holding_id?: string | null;
  filial_id?: string | null;
  password?: string;
  permission_overrides?: ModulePermission[];
}

export interface UpdateUserInput {
  full_name?: string;
  role_id?: string;
  holding_id?: string | null;
  filial_id?: string | null;
  status?: UserStatus;
  permission_overrides?: ModulePermission[];
}

export async function getUsers(params?: {
  holding_id?: string;
  filial_id?: string;
}): Promise<AppUser[]> {
  const query = new URLSearchParams();
  if (params?.holding_id) query.set("holding_id", params.holding_id);
  if (params?.filial_id) query.set("filial_id", params.filial_id);
  const qs = query.toString();
  return apiFetch<AppUser[]>(`/users${qs ? `?${qs}` : ""}`);
}

export async function getUser(id: string): Promise<AppUser> {
  return apiFetch<AppUser>(`/users/${id}`);
}

export async function createUser(input: CreateUserInput): Promise<AppUser> {
  return apiFetch<AppUser>("/users", { method: "POST", body: JSON.stringify(input) });
}

export async function updateUser(id: string, input: UpdateUserInput): Promise<AppUser> {
  return apiFetch<AppUser>(`/users/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}