import { Suspense } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import NewVehicleOrderView from "@/components/compras/NewVehicleOrderView";

export default function NewVehicleOrderPage() {
  return (
    <RequireScope scope="filial">
      <div className="min-h-screen bg-ash">
        <DashboardHeader />
        <Suspense fallback={null}>
          <div className="mx-auto max-w-4xl px-6 py-12">
            <NewVehicleOrderView />
          </div>
        </Suspense>
      </div>
    </RequireScope>
  );
}
