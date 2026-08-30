import { Suspense } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import AdministracionLayout from "@/components/administracion/AdministracionLayout";
import ComprasProveedoresView from "@/components/administracion/ComprasProveedoresView";

export default function AdministracionPage() {
  return (
    <RequireScope scope="filial">
      <div className="min-h-screen bg-ash">
        <DashboardHeader />
        <Suspense fallback={null}>
          <AdministracionLayout>
            <ComprasProveedoresView />
          </AdministracionLayout>
        </Suspense>
      </div>
    </RequireScope>
  );
}

