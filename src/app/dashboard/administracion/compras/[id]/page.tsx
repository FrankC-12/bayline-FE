import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import PurchaseRequestDetailView from "@/components/administracion/PurchaseRequestDetailView";

export default async function PurchaseRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <RequireScope scope="filial">
      <div className="min-h-screen bg-ash">
        <DashboardHeader />
        <div className="mx-auto max-w-4xl px-6 py-12">
          <PurchaseRequestDetailView requestId={id} />
        </div>
      </div>
    </RequireScope>
  );
}