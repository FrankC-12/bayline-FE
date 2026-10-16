import { Suspense } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import ConcesionarioLayout from "@/components/concesionario/ConcesionarioLayout";
import FinancingsView from "@/components/concesionario/FinancingsView";

export default function FinancingsPage() {
  return (
    <RequireScope scope="filial">
      <div className="min-h-screen bg-ash">
        <DashboardHeader />
        <Suspense fallback={null}>
          <ConcesionarioLayout>
            <FinancingsView />
          </ConcesionarioLayout>
        </Suspense>
      </div>
    </RequireScope>
  );
}