import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import ConcesionarioLayout from "@/components/concesionario/ConcesionarioLayout";
import VehicleSalesView from "@/components/concesionario/VehicleSalesView";

export default function ConcesionarioSalesPage() {
  return (
    <RequireScope scope="filial">
      <div className="min-h-screen bg-ash">
        <DashboardHeader />
        <ConcesionarioLayout>
          <VehicleSalesView />
        </ConcesionarioLayout>
      </div>
    </RequireScope>
  );
}