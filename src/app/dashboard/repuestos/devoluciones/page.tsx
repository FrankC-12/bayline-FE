import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import PartsLayout from "@/components/parts/PartsLayout";
import PartReturnsListView from "@/components/parts/PartReturnsListView";

export default function PartReturnsPage() {
  return (
    <RequireScope scope="filial">
      <div className="min-h-screen bg-ash">
        <DashboardHeader />
        <PartsLayout>
          <PartReturnsListView />
        </PartsLayout>
      </div>
    </RequireScope>
  );
}