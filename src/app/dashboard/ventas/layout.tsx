import RequireModuleAccess from "@/components/auth/RequireModuleAccess";

export default function VentasModuleLayout({ children }: { children: React.ReactNode }) {
  return <RequireModuleAccess moduleId="ventas">{children}</RequireModuleAccess>;
}
