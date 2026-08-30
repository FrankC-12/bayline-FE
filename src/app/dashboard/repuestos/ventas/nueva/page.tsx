import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import NewPartSaleView from "@/components/parts/NewPartSaleView";

export default function NewPartSalePage() {
  return (
    <RequireScope scope="filial">
      <div className="min-h-screen bg-ash">
        <DashboardHeader />
        <div className="mx-auto max-w-6xl px-6 py-12">
          <NewPartSaleView />
        </div>
      </div>
    </RequireScope>
  );
}