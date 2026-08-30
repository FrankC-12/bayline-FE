"use client";

import { useRouter } from "next/navigation";
import { Bell, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

function getInitials(email: string) {
  return email.slice(0, 2).toUpperCase();
}

export default function DashboardHeader() {
  const router = useRouter();
  const { currentUser, logout } = useAuth();

  function handleLogout() {
    logout();
    router.push("/login");
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
            aria-label="Cerrar sesión"
            className="text-slate-300 transition hover:text-white"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}