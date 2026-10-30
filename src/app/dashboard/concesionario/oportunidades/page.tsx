import { Suspense } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import ConcesionarioLayout from "@/components/concesionario/ConcesionarioLayout";
import OpportunitiesView from "@/components/concesionario/OpportunitiesView";
export default function OpportunitiesPage() {
  return (
    <RequireScope scope="filial">
      <div className="min-h-screen bg-ash">
        <DashboardHeader />
        <Suspense fallback={null}>
          <ConcesionarioLayout>
            <OpportunitiesView />
          </ConcesionarioLayout>
        </Suspense>
      </div>
    </RequireScope>
  );
}
