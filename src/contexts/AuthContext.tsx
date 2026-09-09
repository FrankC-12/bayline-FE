"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { AUTH_SESSION_EXPIRED_EVENT, removeLegacyTokens } from "@/lib/api/client";
import { getSessionUser, login as loginRequest, logout as logoutRequest } from "@/lib/api/auth";
import type { CurrentUser } from "@/types/auth";

interface AuthContextValue {
  currentUser: CurrentUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<CurrentUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      try {
        removeLegacyTokens();
        const user = await getSessionUser();
        if (active) setCurrentUser(user);
      } catch {
        if (active) setCurrentUser(null);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    const handleSessionExpired = () => {
      setCurrentUser(null);
      setIsLoading(false);
    };

    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);
    void restoreSession();

    return () => {
      active = false;
      window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);
    };
  }, []);

  async function login(email: string, password: string): Promise<CurrentUser> {
    const user = await loginRequest({ email, password });
    setCurrentUser(user);
    return user;
  }

  async function logout(): Promise<void> {
    await logoutRequest();
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
