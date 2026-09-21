import RequireModuleAccess from "@/components/auth/RequireModuleAccess";

export default function KpisModuleLayout({ children }: { children: React.ReactNode }) {
  return <RequireModuleAccess moduleId="kpis">{children}</RequireModuleAccess>;
}
