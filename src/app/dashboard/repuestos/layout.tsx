import RequireModuleAccess from "@/components/auth/RequireModuleAccess";

export default function RepuestosModuleLayout({ children }: { children: React.ReactNode }) {
  return <RequireModuleAccess moduleId="repuestos">{children}</RequireModuleAccess>;
}
