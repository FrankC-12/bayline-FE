"use client";

import { useAuth } from "@/contexts/AuthContext";
import ModuleCard from "./ModuleCard";
import { modules } from "./modules-data";

export default function ModuleGrid() {
  const { currentUser, hasModuleAccess } = useAuth();

  // Only filial-scoped users have per-module permissions to filter by —
  // holding/platform callers never reach this grid in practice (they land
  // on their own dashboards), so nothing is hidden from them here.
  const visibleModules =
    currentUser?.scope === "filial" ? modules.filter((m) => !m.moduleId || hasModuleAccess(m.moduleId)) : modules;

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {visibleModules.map((m) => (
        <ModuleCard key={m.title} {...m} />
      ))}
    </div>
  );
}
