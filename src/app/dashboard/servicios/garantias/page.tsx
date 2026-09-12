import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import ServiceOrdersLayout from "@/components/service-orders/ServiceOrdersLayout";
import WarrantyClaimsView from "@/components/service-orders/WarrantyClaimsView";

export default function WarrantyClaimsPage() {
  return (
    <RequireScope scope="filial">
      <div className="min-h-screen bg-ash">
        <DashboardHeader />
        <ServiceOrdersLayout>
          <WarrantyClaimsView />
        </ServiceOrdersLayout>
      </div>
    </RequireScope>
  );
}
