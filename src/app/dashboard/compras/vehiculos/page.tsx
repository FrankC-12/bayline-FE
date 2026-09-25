import { Suspense } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import ComprasLayout from "@/components/compras/ComprasLayout";
import VehicleOrdersListView from "@/components/compras/VehicleOrdersListView";

export default function VehicleOrdersPage() {
  return (
    <RequireScope scope="filial">
      <div className="min-h-screen bg-ash">
        <DashboardHeader />
        <Suspense fallback={null}>
          <ComprasLayout>
            <VehicleOrdersListView />
          </ComprasLayout>
        </Suspense>
      </div>
    </RequireScope>
  );
}
