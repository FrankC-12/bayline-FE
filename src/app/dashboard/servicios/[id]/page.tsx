import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import ServiceOrdersLayout from "@/components/service-orders/ServiceOrdersLayout";
import OrderDetail from "@/components/service-orders/OrderDetail";

interface ServiceOrderDetailPageProps {
  params: { id: string };
}

export default function ServiceOrderDetailPage({ params }: ServiceOrderDetailPageProps) {
  return (
    <RequireScope scope="filial">
      <div className="flex min-h-dvh flex-col bg-ash [&>header]:shrink-0">
        <DashboardHeader />
        <ServiceOrdersLayout>
          <OrderDetail orderId={params.id} />
        </ServiceOrdersLayout>
      </div>
    </RequireScope>
  );
}