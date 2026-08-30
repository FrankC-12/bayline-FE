import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import PostVentasLayout from "@/components/post-ventas/PostVentasLayout";
import TemparioListView from "@/components/post-ventas/TemparioListView";

export default function PostVentasPage() {
  return (
    <RequireScope scope="filial">
      <div className="min-h-screen bg-ash">
        <DashboardHeader />
        <PostVentasLayout>
          <TemparioListView />
        </PostVentasLayout>
      </div>
    </RequireScope>
  );
}