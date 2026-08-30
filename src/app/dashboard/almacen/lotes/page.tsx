import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import AlmacenLayout from "@/components/warehouse/WarehouseLayout";
import LotsSystemView from "@/components/warehouse/LotsSystemView";

export default function AlmacenLotsPage() {
  return (
    <RequireScope scope="filial">
      <div className="min-h-screen bg-ash">
        <DashboardHeader />
        <AlmacenLayout>
          <LotsSystemView />
        </AlmacenLayout>
      </div>
    </RequireScope>
  );
}