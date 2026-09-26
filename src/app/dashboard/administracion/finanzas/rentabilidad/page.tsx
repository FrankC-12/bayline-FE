import { Suspense } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import RequireModuleAccess from "@/components/auth/RequireModuleAccess";
import AdministracionLayout from "@/components/administracion/AdministracionLayout";
import RentabilidadView from "@/components/administracion/RentabilidadView";

export default function RentabilidadPage() {
  return (
    <RequireScope scope="filial">
      <div className="min-h-screen bg-ash">
        <DashboardHeader />
        <Suspense fallback={null}>
          <AdministracionLayout>
            <RequireModuleAccess moduleId="finanzas-rentabilidad">
              <RentabilidadView />
            </RequireModuleAccess>
          </AdministracionLayout>
        </Suspense>
      </div>
    </RequireScope>
  );
}

