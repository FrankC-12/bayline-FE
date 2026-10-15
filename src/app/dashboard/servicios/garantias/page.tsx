import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import ServiceOrdersLayout from "@/components/service-orders/ServiceOrdersLayout";
import WarrantyClaimsListView from "@/components/service-orders/WarrantyClaimsListView";

export default function WarrantyClaimsPage() {
  return (
    <RequireScope scope="filial">
      <div className="flex min-h-dvh flex-col bg-ash [&>header]:shrink-0">
        <DashboardHeader />
        <ServiceOrdersLayout>
          <WarrantyClaimsListView />
        </ServiceOrdersLayout>
      </div>
    </RequireScope>
  );
}
