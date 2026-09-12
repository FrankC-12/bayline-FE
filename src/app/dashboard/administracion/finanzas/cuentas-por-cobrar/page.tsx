import { Suspense } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import AdministracionLayout from "@/components/administracion/AdministracionLayout";
import ReceivablesView from "@/components/administracion/ReceivablesView";

export default function ReceivablesPage() {
  return (
    <RequireScope scope="filial">
      <div className="min-h-screen bg-ash">
        <DashboardHeader />
        <Suspense fallback={null}>
          <AdministracionLayout>
            <ReceivablesView />
          </AdministracionLayout>
        </Suspense>
      </div>
    </RequireScope>
  );
}
