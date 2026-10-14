import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import PurchaseRequestDetailView from "@/components/compras/PurchaseRequestDetailView";
import WarehouseLayout from "@/components/warehouse/WarehouseLayout";
export default async function PurchasePage({ params }: { params: Promise<{id:string}> }) {
 const { id }=await params;
 return <RequireScope scope="filial"><div className="min-h-screen bg-ash"><DashboardHeader /><WarehouseLayout><PurchaseRequestDetailView requestId={id} /></WarehouseLayout></div></RequireScope>;
}
