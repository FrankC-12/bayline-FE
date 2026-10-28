"use client";

import Link from "next/link";
import { switchHoldingContext } from "@/lib/api/auth";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import NotificationInbox from "./NotificationInbox";
import { useAuth } from "@/contexts/AuthContext";

function getInitials(email: string) {
  return email.slice(0, 2).toUpperCase();
}

export default function DashboardHeader() {
  const router = useRouter();
  const { currentUser, logout } = useAuth();

  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);
  async function returnToHolding() {
    if (switching) return;
    setSwitching(true);
    setError(null);
    try {
      await switchHoldingContext(null);
      window.location.assign("/holding/entrada");
    } catch {
      setError("No se pudo volver al holding. Intenta de nuevo.");
      setSwitching(false);
    }
  }
  async function handleLogout() {
    setLoggingOut(true);
    setError(null);
    try {
      await logout();
      router.push("/login");
    } catch {
      setError("No se pudo cerrar la sesión. Intenta nuevamente.");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header className="border-b border-navy/10 bg-navy">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <span className="font-display text-lg font-bold text-white">
          Bayline
        </span>

        <div className="flex items-center gap-4">
          {currentUser?.scope === "holding" && (
            <Link
              href="/holding/entrada"
              className="rounded-full border border-white/25 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10"
            >
              Cambiar vista
            </Link>
          )}
          {currentUser?.holdingContext && (
            <button
              onClick={() => void returnToHolding()}
              disabled={switching}
              className="rounded-full border border-white/25 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 disabled:opacity-50"
            >
              {switching ? "Volviendo…" : "Volver al holding"}
            </button>
          )}
          {currentUser && <NotificationInbox />}
          {currentUser && (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue font-mono text-sm font-semibold text-white">
              {getInitials(currentUser.email)}
            </span>
          )}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            aria-label="Cerrar sesión"
            className="text-slate-300 transition hover:text-white"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
      {currentUser?.holdingContext && (
        <div className="border-t border-white/10 bg-blue/20 px-6 py-2 text-center text-xs text-white">
          Administrando filial:{" "}
          <strong>{currentUser.filialName || currentUser.filialId}</strong> ·
          Acceso del holding
        </div>
      )}
      {error && (
        <p role="alert" className="px-6 pb-3 text-sm text-red-200">
          {error}
        </p>
      )}
    </header>
  );
}
