import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import AjustesView from "@/components/ajustes/AjustesView";

export default function AjustesPage() {
  return (
    <RequireScope scope="filial">
      <div className="min-h-screen bg-ash">
        <DashboardHeader />
        <AjustesView />
      </div>
    </RequireScope>
  );
}
