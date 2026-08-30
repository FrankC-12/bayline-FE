import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import HoldingsView from "@/components/platform/HoldingsView";

export default function PlatformHoldingsPage() {
  return (
    <RequireScope scope="platform">
      <div className="min-h-screen bg-ash">
        <DashboardHeader />
        <HoldingsView />
      </div>
    </RequireScope>
  );
}