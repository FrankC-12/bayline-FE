import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import ServiceOrdersLayout from "@/components/service-orders/ServiceOrdersLayout";
import InspectionsView from "@/components/inspections/InspectionsView";

export default function InspeccionesPage() {
  return (
    <RequireScope scope="filial">
      <div className="min-h-screen bg-ash">
        <DashboardHeader />
        <ServiceOrdersLayout>
          <InspectionsView />
        </ServiceOrdersLayout>
      </div>
    </RequireScope>
  );
}