import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import NewPartReturnView from "@/components/parts/NewPartReturnView";

export default function NewPartReturnPage() {
  return (
    <RequireScope scope="filial">
      <div className="min-h-screen bg-ash">
        <DashboardHeader />
        <div className="mx-auto max-w-6xl px-6 py-12">
          <NewPartReturnView />
        </div>
      </div>
    </RequireScope>
  );
}