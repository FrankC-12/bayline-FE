import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import ServiceOrdersLayout from "@/components/service-orders/ServiceOrdersLayout";
import DraftsView from "@/components/service-orders/DraftsView";

export default function DraftOrdersPage() {
  return (
    <RequireScope scope="filial">
      <div className="flex min-h-dvh flex-col bg-ash [&>header]:shrink-0">
        <DashboardHeader />
        <ServiceOrdersLayout>
          <DraftsView />
        </ServiceOrdersLayout>
      </div>
    </RequireScope>
  );
}
