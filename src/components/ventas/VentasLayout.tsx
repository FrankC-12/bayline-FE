"use client";

import Link from "next/link";
import { ChevronLeft, TrendingUp } from "lucide-react";

export default function VentasLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-7xl gap-8 px-6 py-12">
      <aside className="w-56 shrink-0">
        <Link href="/dashboard" className="mb-4 flex items-center gap-1.5 text-sm font-medium text-steel hover:text-navy">
          <ChevronLeft className="h-4 w-4" />
          Volver al Dashboard
        </Link>
        <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-steel">Ventas</p>
        <nav className="space-y-1">
          <Link
            href="/dashboard/ventas"
            className="flex items-center gap-2.5 rounded-xl bg-blue-light px-3 py-2 text-sm font-medium text-blue"
          >
            <TrendingUp className="h-4 w-4" />
            Ventas
          </Link>
        </nav>
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}