import RequireModuleAccess from "@/components/auth/RequireModuleAccess";

export default function ComprasModuleLayout({ children }: { children: React.ReactNode }) {
  return <RequireModuleAccess moduleId="compras">{children}</RequireModuleAccess>;
}
