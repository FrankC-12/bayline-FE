import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function KpisLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-6xl gap-8 px-6 py-12">
      <aside className="w-56 shrink-0">
        <Link href="/dashboard" className="mb-4 flex items-center gap-1.5 text-sm font-medium text-steel hover:text-navy">
          <ChevronLeft className="h-4 w-4" />
          Volver al Dashboard
        </Link>
        <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-steel">KPIs</p>
        <nav className="space-y-1">
          <Link href="/dashboard/kpis" className="flex items-center rounded-xl bg-blue-light px-3 py-2 text-sm font-medium text-blue">
            Torre de Control
          </Link>
        </nav>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}