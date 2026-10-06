import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import PostVentasLayout from "@/components/post-ventas/PostVentasLayout";
import OrderTypeListView from "@/components/post-ventas/OrderTypeListView";

export default function OrderTypesPage() {
  return (
    <RequireScope scope="filial">
      <div className="min-h-screen bg-ash">
        <DashboardHeader />
        <PostVentasLayout>
          <OrderTypeListView />
        </PostVentasLayout>
      </div>
    </RequireScope>
  );
}
