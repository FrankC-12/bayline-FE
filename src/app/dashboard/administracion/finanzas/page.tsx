import { Suspense } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import AdministracionLayout from "@/components/administracion/AdministracionLayout";
import FinanceDashboardView from "@/components/administracion/FinanceDashboardView";

export default function FinanceDashboardPage() {
  return (
    <RequireScope scope="filial">
      <div className="min-h-screen bg-ash">
        <DashboardHeader />
        <Suspense fallback={null}>
          <AdministracionLayout>
            <FinanceDashboardView />
          </AdministracionLayout>
        </Suspense>
      </div>
    </RequireScope>
  );
}

