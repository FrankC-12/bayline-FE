import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import VehicleOrderDetailView from "@/components/compras/VehicleOrderDetailView";

export default async function VehicleOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <RequireScope scope="filial">
      <div className="min-h-screen bg-ash">
        <DashboardHeader />
        <div className="mx-auto max-w-4xl px-6 py-12">
          <VehicleOrderDetailView orderId={id} />
        </div>
      </div>
    </RequireScope>
  );
}
