import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import ServiceOrdersLayout from "@/components/service-orders/ServiceOrdersLayout";
import HistorialView from "@/components/service-orders/HistorialView";

export default function HistorialPage() {
  return (
    <RequireScope scope="filial">
      <div className="min-h-screen bg-ash">
        <DashboardHeader />
        <ServiceOrdersLayout>
          <HistorialView />
        </ServiceOrdersLayout>
      </div>
    </RequireScope>
  );
}