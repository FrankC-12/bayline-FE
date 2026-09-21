import RequireModuleAccess from "@/components/auth/RequireModuleAccess";

export default function AjustesModuleLayout({ children }: { children: React.ReactNode }) {
  return <RequireModuleAccess moduleId="ajustes">{children}</RequireModuleAccess>;
}
