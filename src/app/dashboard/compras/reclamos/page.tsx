import { Suspense } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import ComprasLayout from "@/components/compras/ComprasLayout";
import SupplierClaimsView from "@/components/compras/SupplierClaimsView";

export default function SupplierClaimsPage() {
  return (
    <RequireScope scope="filial">
      <div className="min-h-screen bg-ash">
        <DashboardHeader />
        <Suspense fallback={null}>
          <ComprasLayout>
            <SupplierClaimsView />
          </ComprasLayout>
        </Suspense>
      </div>
    </RequireScope>
  );
}
