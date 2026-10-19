import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import ServiceOrdersLayout from "@/components/service-orders/ServiceOrdersLayout";
import NewDraftRoute from "@/components/service-orders/NewDraftRoute";
export default function NewOrderPage(){return <RequireScope scope="filial"><div className="flex min-h-dvh flex-col bg-ash"><DashboardHeader/><ServiceOrdersLayout><NewDraftRoute/></ServiceOrdersLayout></div></RequireScope>;}
