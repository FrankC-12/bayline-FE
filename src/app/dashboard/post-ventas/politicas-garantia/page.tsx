import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import PostVentasLayout from "@/components/post-ventas/PostVentasLayout";
import WarrantyPolicyListView from "@/components/post-ventas/WarrantyPolicyListView";

export default function WarrantyPoliciesPage() {
  return (
    <RequireScope scope="filial">
      <div className="min-h-screen bg-ash">
        <DashboardHeader />
        <PostVentasLayout>
          <WarrantyPolicyListView />
        </PostVentasLayout>
      </div>
    </RequireScope>
  );
}
