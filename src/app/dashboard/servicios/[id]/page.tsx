import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import OrderDetail from "@/components/service-orders/OrderDetail";

interface ServiceOrderDetailPageProps {
  params: { id: string };
}

export default function ServiceOrderDetailPage({ params }: ServiceOrderDetailPageProps) {
  return (
    <RequireScope scope="filial">
      <div className="min-h-screen bg-ash">
        <DashboardHeader />
        <OrderDetail orderId={params.id} />
      </div>
    </RequireScope>
  );
}