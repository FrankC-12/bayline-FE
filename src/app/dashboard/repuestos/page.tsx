import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import PartsLayout from "@/components/parts/PartsLayout";
import PartsCatalogView from "@/components/parts/PartsCatalogView";

export default function PartsCatalogPage() {
  return (
    <RequireScope scope="filial">
      <div className="min-h-screen bg-ash">
        <DashboardHeader />
        <PartsLayout>
          <PartsCatalogView />
        </PartsLayout>
      </div>
    </RequireScope>
  );
}