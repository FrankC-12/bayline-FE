import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import AlmacenLayout from "@/components/warehouse/WarehouseLayout";
import InventoryDashboardView from "@/components/warehouse/InventoryDashboardView";

export default function AlmacenInventoryPage() {
  return (
    <RequireScope scope="filial">
      <div className="min-h-screen bg-ash">
        <DashboardHeader />
        <AlmacenLayout>
          <InventoryDashboardView />
        </AlmacenLayout>
      </div>
    </RequireScope>
  );
}