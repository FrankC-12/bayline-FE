import DashboardHeader from "@/components/dashboard/DashboardHeader";
import UsersView from "@/components/users/UsersView";
import RequireScope from "@/components/auth/RequireScope";

export default function UsersPage() {
  return (
    <RequireScope scope="filial">
      <div className="min-h-screen bg-ash">
        <DashboardHeader />
        <UsersView />
      </div>
    </RequireScope>
  );
}