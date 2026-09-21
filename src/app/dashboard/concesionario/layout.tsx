import RequireModuleAccess from "@/components/auth/RequireModuleAccess";

export default function ConcesionarioModuleLayout({ children }: { children: React.ReactNode }) {
  return <RequireModuleAccess moduleId="concesionario">{children}</RequireModuleAccess>;
}
