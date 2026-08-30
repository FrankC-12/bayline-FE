import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import PartsLayout from "@/components/parts/PartsLayout";
import PartSalesListView from "@/components/parts/PartSaleListView";

export default function PartSalesPage() {
  return (
    <RequireScope scope="filial">
      <div className="min-h-screen bg-ash">
        <DashboardHeader />
        <PartsLayout>
          <PartSalesListView />
        </PartsLayout>
      </div>
    </RequireScope>
  );
}