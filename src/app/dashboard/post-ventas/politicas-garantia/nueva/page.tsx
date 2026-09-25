import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import WarrantyPolicyFormView from "@/components/post-ventas/WarrantyPolicyFormView";

export default function NewWarrantyPolicyPage() {
  return (
    <RequireScope scope="filial">
      <div className="min-h-screen bg-ash">
        <DashboardHeader />
        <div className="mx-auto max-w-4xl px-6 py-12">
          <WarrantyPolicyFormView />
        </div>
      </div>
    </RequireScope>
  );
}
