import { apiFetch, setTokens, clearToken } from "./client";

export interface LoginInput {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  refresh_expires_in: number;
}

export async function login(input: LoginInput): Promise<TokenResponse> {
  const response = await apiFetch<TokenResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
    auth: false,
  });
  setTokens(response.access_token, response.refresh_token);
  return response;
}

export function logout(): void {
  clearToken();
}
