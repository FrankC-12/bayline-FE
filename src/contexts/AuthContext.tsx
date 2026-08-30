"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { decodeJwtPayload, isTokenExpired, type DecodedToken } from "@/lib/auth/jwt";
import { getToken, clearToken } from "@/lib/api/client";
import { login as loginRequest, logout as logoutRequest } from "@/lib/api/auth";
import type { CurrentUser, RoleScope } from "@/types/auth";

interface AuthContextValue {
  currentUser: CurrentUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<CurrentUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function mapDecodedToCurrentUser(decoded: DecodedToken): CurrentUser {
  return {
    userId: decoded.sub,
    email: decoded.email,
    roleId: decoded.role_id,
    roleSlug: decoded.role_slug,
    scope: decoded.scope as RoleScope,
    holdingId: decoded.holding_id,
    filialId: decoded.filial_id,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const decoded = decodeJwtPayload(token);
      if (isTokenExpired(decoded)) {
        clearToken();
        setCurrentUser(null);
      } else {
        setCurrentUser(mapDecodedToCurrentUser(decoded));
      }
    } catch {
      clearToken();
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  async function login(email: string, password: string): Promise<CurrentUser> {
    const response = await loginRequest({ email, password });
    const decoded = decodeJwtPayload(response.access_token);
    const user = mapDecodedToCurrentUser(decoded);
    setCurrentUser(user);
    return user;
  }

  function logout(): void {
    logoutRequest();
    setCurrentUser(null);
  }

  return (
    <AuthContext.Provider value={{ currentUser, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}