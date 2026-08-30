import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import ServiceOrdersLayout from "@/components/service-orders/ServiceOrdersLayout";
import OrdersBoard from "@/components/service-orders/OrdersBoard";

export default function ServiceOrdersPage() {
  return (
    <RequireScope scope="filial">
      <div className="min-h-screen bg-ash">
        <DashboardHeader />
        <ServiceOrdersLayout>
          <OrdersBoard />
        </ServiceOrdersLayout>
      </div>
    </RequireScope>
  );
}