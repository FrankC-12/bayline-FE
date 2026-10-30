import DashboardShell from "@/components/dashboard/DashboardShell";
import RequireScope from "@/components/auth/RequireScope";
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireScope scope="filial">
      <DashboardShell>{children}</DashboardShell>
    </RequireScope>
  );
}
