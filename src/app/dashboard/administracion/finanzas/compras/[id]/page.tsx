import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import PurchaseRequestDetailView from "@/components/compras/PurchaseRequestDetailView";
export default async function PurchasePage({ params }: { params: Promise<{id:string}> }) {
 const { id }=await params;
 return <RequireScope scope="filial"><div className="min-h-screen bg-ash"><DashboardHeader /><div className="mx-auto max-w-6xl px-6 py-10"><PurchaseRequestDetailView requestId={id} /></div></div></RequireScope>;
}
