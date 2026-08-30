import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import VentasLayout from "@/components/ventas/VentasLayout";
import VentasView from "@/components/ventas/VentasView";

export default function VentasPage() {
  return (
    <RequireScope scope="filial">
      <div className="min-h-screen bg-ash">
        <DashboardHeader />
        <VentasLayout>
          <VentasView />
        </VentasLayout>
      </div>
    </RequireScope>
  );
}