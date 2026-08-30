import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import ServiceOrdersLayout from "@/components/service-orders/ServiceOrdersLayout";
import UpsellsView from "@/components/service-orders/UpsellsView";

export default function UpsellsPage() {
  return (
    <RequireScope scope="filial">
      <div className="min-h-screen bg-ash">
        <DashboardHeader />
        <ServiceOrdersLayout>
          <UpsellsView />
        </ServiceOrdersLayout>
      </div>
    </RequireScope>
  );
}