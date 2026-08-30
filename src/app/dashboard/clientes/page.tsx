import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import ClientsView from "@/components/clients/ClientsView";

export default function ClientsPage() {
  return (
    <RequireScope scope="filial">
      <div className="min-h-screen bg-ash">
        <DashboardHeader />
        <ClientsView />
      </div>
    </RequireScope>
  );
}