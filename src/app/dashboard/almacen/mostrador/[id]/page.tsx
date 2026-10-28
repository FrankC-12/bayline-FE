import DashboardHeader from "@/components/dashboard/DashboardHeader";
import PartSaleDetailView from "@/components/parts/PartSaleDetailView";
export default function CounterDispatchPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="min-h-screen bg-ash">
      <DashboardHeader />
      <main className="mx-auto max-w-4xl px-6 py-12">
        <PartSaleDetailView saleId={params.id} warehouseView />
      </main>
    </div>
  );
}
