import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import ServiceOrdersLayout from "@/components/service-orders/ServiceOrdersLayout";
import CalendarView from "@/components/calendar/CalendarView";

export default function CalendarioPage() {
  return (
    <RequireScope scope="filial">
      <div className="min-h-screen bg-ash">
        <DashboardHeader />
        <ServiceOrdersLayout>
          <CalendarView />
        </ServiceOrdersLayout>
      </div>
    </RequireScope>
  );
}