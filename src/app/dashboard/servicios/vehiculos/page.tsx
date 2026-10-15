import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import ServiceOrdersLayout from "@/components/service-orders/ServiceOrdersLayout";
import ServiceVehiclesView from "@/components/service-orders/ServiceVehiclesView";
export default function ServiceVehiclesPage() {
 return <RequireScope scope="filial"><div className="flex min-h-dvh flex-col bg-ash"><DashboardHeader/><ServiceOrdersLayout><ServiceVehiclesView/></ServiceOrdersLayout></div></RequireScope>;
}
