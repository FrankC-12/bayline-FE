import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ModuleGrid from "@/components/dashboard/ModuleGrid";
import RequireScope from "@/components/auth/RequireScope";

export default function DashboardPage() {
  return (
    <RequireScope scope="filial">
      <div className="min-h-screen bg-ash">
        <DashboardHeader />
        <main className="mx-auto max-w-7xl px-6 py-12">
          <div className="mb-8">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-blue">
              Panel de módulos
            </span>
            <h1 className="mt-2 font-display text-3xl font-bold text-navy">
              ¿Qué quieres gestionar hoy?
            </h1>
          </div>
          <ModuleGrid />
        </main>
      </div>
    </RequireScope>
  );
}