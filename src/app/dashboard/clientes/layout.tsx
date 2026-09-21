import RequireModuleAccess from "@/components/auth/RequireModuleAccess";

export default function ClientesModuleLayout({ children }: { children: React.ReactNode }) {
  return <RequireModuleAccess moduleId="clientes-vehiculos">{children}</RequireModuleAccess>;
}
