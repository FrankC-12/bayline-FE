import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import ServiceOrdersLayout from "@/components/service-orders/ServiceOrdersLayout";
import OrdersBoard from "@/components/service-orders/OrdersBoard";

export default function ServiceOrdersPage() {
  return (
    <RequireScope scope="filial">
      <div className="flex h-dvh flex-col overflow-hidden bg-ash [&>header]:shrink-0">
        <DashboardHeader />
        <ServiceOrdersLayout>
          <OrdersBoard />
        </ServiceOrdersLayout>
      </div>
    </RequireScope>
  );
}