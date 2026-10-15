import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import ServiceOrdersLayout from "@/components/service-orders/ServiceOrdersLayout";
import InspectionsView from "@/components/inspections/InspectionsView";

export default function InspeccionesPage() {
  return (
    <RequireScope scope="filial">
      <div className="flex min-h-dvh flex-col bg-ash [&>header]:shrink-0">
        <DashboardHeader />
        <ServiceOrdersLayout>
          <InspectionsView />
        </ServiceOrdersLayout>
      </div>
    </RequireScope>
  );
}