import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import PostVentasLayout from "@/components/post-ventas/PostVentasLayout";
import MaintenancePlanListView from "@/components/post-ventas/MaintenancePlanListView";

export default function MaintenancePlansPage() {
  return (
    <RequireScope scope="filial">
      <div className="min-h-screen bg-ash">
        <DashboardHeader />
        <PostVentasLayout>
          <MaintenancePlanListView />
        </PostVentasLayout>
      </div>
    </RequireScope>
  );
}
