import { Suspense } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import AdministracionLayout from "@/components/administracion/AdministracionLayout";
import AccountsView from "@/components/administracion/AccountsView";

export default function AccountsPage() {
  return (
    <RequireScope scope="filial">
      <div className="min-h-screen bg-ash">
        <DashboardHeader />
        <Suspense fallback={null}>
          <AdministracionLayout>
            <AccountsView />
          </AdministracionLayout>
        </Suspense>
      </div>
    </RequireScope>
  );
}

