import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import ConcesionarioLayout from "@/components/concesionario/ConcesionarioLayout";
import VehicleDashboardView from "@/components/concesionario/VehicleDashboardView";

export default function ConcesionarioDashboardPage() {
  return (
    <RequireScope scope="filial">
      <div className="min-h-screen bg-ash">
        <DashboardHeader />
        <ConcesionarioLayout>
          <VehicleDashboardView />
        </ConcesionarioLayout>
      </div>
    </RequireScope>
  );
}