import { Suspense } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import AdministracionLayout from "@/components/administracion/AdministracionLayout";
import IncomeView from "@/components/administracion/IncomeView";

export default function IncomePage() {
  return (
    <RequireScope scope="filial">
      <div className="min-h-screen bg-ash">
        <DashboardHeader />
        <Suspense fallback={null}>
          <AdministracionLayout>
            <IncomeView />
          </AdministracionLayout>
        </Suspense>
      </div>
    </RequireScope>
  );
}

