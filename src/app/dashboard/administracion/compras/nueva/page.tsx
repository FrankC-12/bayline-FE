import { Suspense } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import NewPurchaseRequestView from "@/components/administracion/NewPurchaseRequestView";

export default function NewPurchaseRequestPage() {
  return (
    <RequireScope scope="filial">
      <div className="min-h-screen bg-ash">
        <DashboardHeader />
        <Suspense fallback={null}>
          <div className="mx-auto max-w-4xl px-6 py-12">
            <NewPurchaseRequestView />
          </div>
        </Suspense>
      </div>
    </RequireScope>
  );
}