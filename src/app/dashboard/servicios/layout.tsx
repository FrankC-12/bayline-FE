import RequireModuleAccess from "@/components/auth/RequireModuleAccess";

export default function ServiciosModuleLayout({ children }: { children: React.ReactNode }) {
  return <RequireModuleAccess moduleId="asesor-servicios">{children}</RequireModuleAccess>;
}
