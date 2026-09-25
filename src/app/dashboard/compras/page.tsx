import { Suspense } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import ComprasLayout from "@/components/compras/ComprasLayout";
import ComprasProveedoresView from "@/components/compras/ComprasProveedoresView";

export default function ComprasPage() {
  return (
    <RequireScope scope="filial">
      <div className="min-h-screen bg-ash">
        <DashboardHeader />
        <Suspense fallback={null}>
          <ComprasLayout>
            <ComprasProveedoresView />
          </ComprasLayout>
        </Suspense>
      </div>
    </RequireScope>
  );
}
