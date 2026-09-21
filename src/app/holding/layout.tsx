import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import { HoldingDashboardProvider } from "@/contexts/HoldingDashboardContext";
import HoldingSidebar from "@/components/holding/HoldingSidebar";

export default function HoldingLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireScope scope="holding">
      <HoldingDashboardProvider>
        <div className="flex h-dvh flex-col overflow-hidden bg-ash [&>header]:shrink-0">
          <DashboardHeader />
          <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 gap-8 overflow-hidden px-6">
            <aside className="w-64 shrink-0 overflow-y-auto overscroll-contain py-12">
              <HoldingSidebar />
            </aside>
            <div
              className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain py-12 pr-2"
              role="region"
              aria-label="Contenido del holding"
              tabIndex={0}
            >
              {children}
            </div>
          </div>
        </div>
      </HoldingDashboardProvider>
    </RequireScope>
  );
}
