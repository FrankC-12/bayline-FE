import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import ServiceOrdersLayout from "@/components/service-orders/ServiceOrdersLayout";
import UpsellsView from "@/components/service-orders/UpsellsView";

export default function UpsellsPage() {
  return (
    <RequireScope scope="filial">
      <div className="flex h-dvh flex-col overflow-hidden bg-ash [&>header]:shrink-0">
        <DashboardHeader />
        <ServiceOrdersLayout>
          <UpsellsView />
        </ServiceOrdersLayout>
      </div>
    </RequireScope>
  );
}