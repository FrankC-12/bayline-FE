import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import KpisLayout from "@/components/kpis/KpisLayout";
import TorreDeControlView from "@/components/kpis/TorreDeControlView";

export default function KpisPage() {
  return (
    <RequireScope scope="filial">
      <div className="min-h-screen bg-ash">
        <DashboardHeader />
        <KpisLayout>
          <TorreDeControlView />
        </KpisLayout>
      </div>
    </RequireScope>
  );
}