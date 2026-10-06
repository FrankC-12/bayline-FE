import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import OrderTypeFormView from "@/components/post-ventas/OrderTypeFormView";

export default function NewOrderTypePage() {
  return (
    <RequireScope scope="filial">
      <div className="min-h-screen bg-ash">
        <DashboardHeader />
        <div className="mx-auto max-w-4xl px-6 py-12">
          <OrderTypeFormView />
        </div>
      </div>
    </RequireScope>
  );
}
