import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import AdministracionLayout from "@/components/administracion/AdministracionLayout";
import AccountDetailView from "@/components/administracion/AccountDetailView";

interface AccountDetailPageProps {
  params: { id: string };
}

export default function AccountDetailPage({ params }: AccountDetailPageProps) {
  return (
    <RequireScope scope="filial">
      <div className="min-h-screen bg-ash">
        <DashboardHeader />
        <AdministracionLayout>
          <AccountDetailView accountId={params.id} />
        </AdministracionLayout>
      </div>
    </RequireScope>
  );
}
