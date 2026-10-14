import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import WarehouseLayout from "@/components/warehouse/WarehouseLayout";
import PurchaseInbox from "@/components/warehouse/PurchaseInbox";
export default function PurchaseInboxPage() { return <RequireScope scope="filial"><div className="min-h-screen bg-ash"><DashboardHeader /><WarehouseLayout><PurchaseInbox /></WarehouseLayout></div></RequireScope>; }
