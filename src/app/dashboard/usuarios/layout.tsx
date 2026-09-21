import RequireModuleAccess from "@/components/auth/RequireModuleAccess";

export default function UsuariosModuleLayout({ children }: { children: React.ReactNode }) {
  return <RequireModuleAccess moduleId="usuarios-accesos">{children}</RequireModuleAccess>;
}
