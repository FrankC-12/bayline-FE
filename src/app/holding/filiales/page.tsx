import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import FilialesView from "@/components/holding/FilialesView";

export default function HoldingFilialesPage() {
  return (
    <RequireScope scope="holding">
      <div className="min-h-screen bg-ash">
        <DashboardHeader />
        <FilialesView />
      </div>
    </RequireScope>
  );
}