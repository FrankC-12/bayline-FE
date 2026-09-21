import RequireModuleAccess from "@/components/auth/RequireModuleAccess";

export default function AdministracionModuleLayout({ children }: { children: React.ReactNode }) {
  return <RequireModuleAccess moduleId="administracion">{children}</RequireModuleAccess>;
}
