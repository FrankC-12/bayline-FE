import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import WarrantyPolicyDetailView from "@/components/post-ventas/WarrantyPolicyDetailView";

export default async function WarrantyPolicyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <RequireScope scope="filial">
      <div className="min-h-screen bg-ash">
        <DashboardHeader />
        <div className="mx-auto max-w-4xl px-6 py-12">
          <WarrantyPolicyDetailView policyId={id} />
        </div>
      </div>
    </RequireScope>
  );
}
