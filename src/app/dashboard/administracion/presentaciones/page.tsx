import { Suspense } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import AdministracionLayout from "@/components/administracion/AdministracionLayout";
import WarrantySubmissionsView from "@/components/administracion/WarrantySubmissionsView";

export default function WarrantySubmissionsPage() {
  return (
    <RequireScope scope="filial">
      <div className="min-h-screen bg-ash">
        <DashboardHeader />
        <Suspense fallback={null}>
          <AdministracionLayout>
            <WarrantySubmissionsView />
          </AdministracionLayout>
        </Suspense>
      </div>
    </RequireScope>
  );
}
