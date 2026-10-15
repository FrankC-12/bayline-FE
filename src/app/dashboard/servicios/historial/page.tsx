import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import ServiceOrdersLayout from "@/components/service-orders/ServiceOrdersLayout";
import HistorialView from "@/components/service-orders/HistorialView";

export default function HistorialPage() {
  return (
    <RequireScope scope="filial">
      <div className="flex min-h-dvh flex-col bg-ash [&>header]:shrink-0">
        <DashboardHeader />
        <ServiceOrdersLayout>
          <HistorialView />
        </ServiceOrdersLayout>
      </div>
    </RequireScope>
  );
}