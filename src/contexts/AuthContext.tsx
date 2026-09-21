"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { AUTH_SESSION_EXPIRED_EVENT, removeLegacyTokens } from "@/lib/api/client";
import { getAccessMap, getSessionUser, login as loginRequest, logout as logoutRequest } from "@/lib/api/auth";
import type { CurrentUser, ModuleAccessLevel } from "@/types/auth";

interface AuthContextValue {
  currentUser: CurrentUser | null;
  isLoading: boolean;
  /** Per-module access map for the current filial-scoped user — fetched
   * once here and shared app-wide (see useModuleAccess, RequireModuleAccess). */
  accessMap: Record<string, ModuleAccessLevel>;
  accessLoading: boolean;
  hasModuleAccess: (moduleId: string) => boolean;
  canEditModule: (moduleId: string) => boolean;
  login: (email: string, password: string) => Promise<CurrentUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessMap, setAccessMap] = useState<Record<string, ModuleAccessLevel>>({});
  const [accessLoading, setAccessLoading] = useState(true);

  const loadAccessMap = useCallback(async () => {
    setAccessLoading(true);
    try {
      const modules = await getAccessMap();
      setAccessMap(modules);
    } catch {
      setAccessMap({});
    } finally {
      setAccessLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      try {
        removeLegacyTokens();
        const user = await getSessionUser();
        if (!active) return;
        setCurrentUser(user);
        if (user.scope === "filial") await loadAccessMap();
        else setAccessLoading(false);
      } catch {
        if (active) {
          setCurrentUser(null);
          setAccessLoading(false);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    const handleSessionExpired = () => {
      setCurrentUser(null);
      setAccessMap({});
      setAccessLoading(false);
      setIsLoading(false);
    };

    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);
    void restoreSession();

    return () => {
      active = false;
      window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);
    };
  }, [loadAccessMap]);

  async function login(email: string, password: string): Promise<CurrentUser> {
    const user = await loginRequest({ email, password });
    setCurrentUser(user);
    if (user.scope === "filial") await loadAccessMap();
    else setAccessLoading(false);
    return user;
  }

  async function logout(): Promise<void> {
    await logoutRequest();
    setCurrentUser(null);
    setAccessMap({});
  }

  function moduleLevel(moduleId: string): ModuleAccessLevel | undefined {
    return accessMap[moduleId];
  }

  function hasModuleAccess(moduleId: string): boolean {
    const level = moduleLevel(moduleId);
    return level === "ver" || level === "editar";
  }

  function canEditModule(moduleId: string): boolean {
    return moduleLevel(moduleId) === "editar";
  }

  return (
    <AuthContext.Provider
      value={{ currentUser, isLoading, accessMap, accessLoading, hasModuleAccess, canEditModule, login, logout }}
    >
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
