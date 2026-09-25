import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import WarrantyPolicyFormView from "@/components/post-ventas/WarrantyPolicyFormView";

export default async function EditWarrantyPolicyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <RequireScope scope="filial">
      <div className="min-h-screen bg-ash">
        <DashboardHeader />
        <div className="mx-auto max-w-4xl px-6 py-12">
          <WarrantyPolicyFormView policyId={id} />
        </div>
      </div>
    </RequireScope>
  );
}
