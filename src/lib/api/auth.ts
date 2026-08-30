import { apiFetch, setToken, clearToken } from "./client";

export interface LoginInput {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export async function login(input: LoginInput): Promise<TokenResponse> {
  const response = await apiFetch<TokenResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
    auth: false,
  });
  setToken(response.access_token);
  return response;
}

export function logout(): void {
  clearToken();
}