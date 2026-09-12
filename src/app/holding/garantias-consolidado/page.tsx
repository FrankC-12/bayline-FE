import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import GarantiasConsolidadoView from "@/components/holding/GarantiasConsolidadoView";

export default function GarantiasConsolidadoPage() {
  return (
    <RequireScope scope="holding">
      <div className="min-h-screen bg-ash">
        <DashboardHeader />
        <GarantiasConsolidadoView />
      </div>
    </RequireScope>
  );
}
