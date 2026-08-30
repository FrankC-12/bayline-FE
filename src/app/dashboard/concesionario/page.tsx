import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import ConcesionarioLayout from "@/components/concesionario/ConcesionarioLayout";
import VehicleCatalogView from "@/components/concesionario/VehicleCatalogView";

export default function ConcesionarioCatalogPage() {
  return (
    <RequireScope scope="filial">
      <div className="min-h-screen bg-ash">
        <DashboardHeader />
        <ConcesionarioLayout>
          <VehicleCatalogView />
        </ConcesionarioLayout>
      </div>
    </RequireScope>
  );
}