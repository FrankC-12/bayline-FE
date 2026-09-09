import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import PartSaleDetailView from "@/components/parts/PartSaleDetailView";

interface PartSaleDetailPageProps {
  params: { id: string };
}

export default function PartSaleDetailPage({ params }: PartSaleDetailPageProps) {
  return (
    <RequireScope scope="filial">
      <div className="min-h-screen bg-ash">
        <DashboardHeader />
        <div className="mx-auto max-w-4xl px-6 py-12">
          <PartSaleDetailView saleId={params.id} />
        </div>
      </div>
    </RequireScope>
  );
}
