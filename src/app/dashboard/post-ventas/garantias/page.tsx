import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import PostVentasLayout from "@/components/post-ventas/PostVentasLayout";
import VehicleWarrantiesView from "@/components/post-ventas/VehicleWarrantiesView";

export default function VehicleWarrantiesPage() {
  return (
    <RequireScope scope="filial">
      <div className="min-h-screen bg-ash">
        <DashboardHeader />
        <PostVentasLayout>
          <VehicleWarrantiesView />
        </PostVentasLayout>
      </div>
    </RequireScope>
  );
}
