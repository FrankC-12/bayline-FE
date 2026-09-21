import RequireModuleAccess from "@/components/auth/RequireModuleAccess";

export default function PostVentasModuleLayout({ children }: { children: React.ReactNode }) {
  return <RequireModuleAccess moduleId="post-ventas">{children}</RequireModuleAccess>;
}
