import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import ServiceOrdersLayout from "@/components/service-orders/ServiceOrdersLayout";
import WarrantyClaimsView from "@/components/service-orders/WarrantyClaimsView";

export default function WarrantyClaimsPage() {
  return (
    <RequireScope scope="filial">
      <div className="flex h-dvh flex-col overflow-hidden bg-ash [&>header]:shrink-0">
        <DashboardHeader />
        <ServiceOrdersLayout>
          <WarrantyClaimsView />
        </ServiceOrdersLayout>
      </div>
    </RequireScope>
  );
}
