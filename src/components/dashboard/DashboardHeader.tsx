"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

function getInitials(email: string) {
  return email.slice(0, 2).toUpperCase();
}

export default function DashboardHeader() {
  const router = useRouter();
  const { currentUser, logout } = useAuth();

  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function handleLogout() {
    setLoggingOut(true); setError(null);
    try { await logout(); router.push("/login"); }
    catch { setError("No se pudo cerrar la sesión. Intenta nuevamente."); }
    finally { setLoggingOut(false); }
  }

  return (
    <header className="border-b border-navy/10 bg-navy">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <span className="font-display text-lg font-bold text-white">Bayline</span>

        <div className="flex items-center gap-4">
          <button aria-label="Notificaciones" className="text-slate-300 transition hover:text-white">
            <Bell className="h-5 w-5" />
          </button>
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
      {error && <p role="alert" className="px-6 pb-3 text-sm text-red-200">{error}</p>}
    </header>
  );
}