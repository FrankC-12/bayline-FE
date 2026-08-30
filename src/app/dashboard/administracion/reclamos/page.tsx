import { Suspense } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import AdministracionLayout from "@/components/administracion/AdministracionLayout";
import SupplierClaimsView from "@/components/administracion/SupplierClaimsView";

export default function SupplierClaimsPage() {
  return (
    <RequireScope scope="filial">
      <div className="min-h-screen bg-ash">
        <DashboardHeader />
        <Suspense fallback={null}>
          <AdministracionLayout>
            <SupplierClaimsView />
          </AdministracionLayout>
        </Suspense>
      </div>
    </RequireScope>
  );
}