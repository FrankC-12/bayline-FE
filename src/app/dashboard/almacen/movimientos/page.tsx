import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import AlmacenLayout from "@/components/warehouse/WarehouseLayout";
import MovementsHistoryView from "@/components/warehouse/MovementsHistoryView";

export default function AlmacenMovementsPage() {
  return (
    <RequireScope scope="filial">
      <div className="min-h-screen bg-ash">
        <DashboardHeader />
        <AlmacenLayout>
          <MovementsHistoryView />
        </AlmacenLayout>
      </div>
    </RequireScope>
  );
}