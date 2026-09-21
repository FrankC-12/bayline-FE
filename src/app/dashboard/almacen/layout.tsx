import RequireModuleAccess from "@/components/auth/RequireModuleAccess";

export default function AlmacenModuleLayout({ children }: { children: React.ReactNode }) {
  return <RequireModuleAccess moduleId="almacen">{children}</RequireModuleAccess>;
}
