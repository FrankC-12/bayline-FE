import { notFound } from "next/navigation";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequireScope from "@/components/auth/RequireScope";
import AjustesView from "@/components/ajustes/AjustesView";
import { SETTINGS_ITEMS } from "@/components/ajustes/sections";
export default async function SettingsPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!SETTINGS_ITEMS.some(item => item.id === section)) notFound();
  return <RequireScope scope="filial"><div className="min-h-screen bg-ash"><DashboardHeader /><AjustesView section={section} /></div></RequireScope>;
}
