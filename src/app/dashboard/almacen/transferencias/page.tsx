import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import AlmacenLayout from "@/components/warehouse/WarehouseLayout";
import TransfersListView from "@/components/warehouse/TransferListView";

export default function AlmacenTransfersPage() {
  return (
    <RequireScope scope="filial">
      <div className="min-h-screen bg-ash">
        <DashboardHeader />
        <AlmacenLayout>
          <TransfersListView />
        </AlmacenLayout>
      </div>
    </RequireScope>
  );
}