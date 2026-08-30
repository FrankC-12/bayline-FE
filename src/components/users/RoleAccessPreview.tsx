import { ShieldCheck } from "lucide-react";
import { MODULE_CATALOG } from "@/lib/module-catalog";
import type { UIAccessLevel } from "@/lib/permissions";

interface RoleAccessPreviewProps {
  fullName: string;
  roleName?: string;
  permissionMap: Record<string, UIAccessLevel>;
}

function getInitials(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  return trimmed
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

const LEVEL_STYLES: Record<UIAccessLevel, string> = {
  editar: "border-blue/50 bg-blue/25 text-blue-light",
  ver: "border-blue/20 bg-blue/10 text-blue-light/70",
  sin_acceso: "border-white/5 bg-white/5 text-slate-600",
};

const LEVEL_LABELS: Record<UIAccessLevel, string> = {
  editar: "Editar",
  ver: "Ver",
  sin_acceso: "Sin acceso",
};

export default function RoleAccessPreview({ fullName, roleName, permissionMap }: RoleAccessPreviewProps) {
  return (
    <div className="relative overflow-hidden rounded-[24px] border border-navy/40 bg-navy p-6">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:28px_28px]" />

      <div className="relative flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-amber" />
        <span className="font-mono text-[11px] uppercase tracking-widest text-slate-400">
          Credencial de acceso
        </span>
      </div>

      <div className="relative mt-6 flex items-center gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/10 font-display text-lg font-bold text-white">
          {getInitials(fullName)}
        </span>
        <div>
          <p className="font-display text-lg font-bold text-white">
            {fullName.trim() || "Nuevo usuario"}
          </p>
          <p className="font-mono text-xs uppercase tracking-widest text-amber">
            {roleName ?? "Sin rol asignado"}
          </p>
        </div>
      </div>

      <div className="relative mt-6 border-t border-white/10 pt-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
            Módulos habilitados
          </p>
          <div className="flex items-center gap-3 font-mono text-[9px] uppercase tracking-widest text-slate-500">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-blue" />
              Editar
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-blue/30" />
              Ver
            </span>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2.5">
          {MODULE_CATALOG.map(({ id, label, icon: Icon }) => {
            const level = permissionMap[id] ?? "sin_acceso";
            return (
              <span
                key={id}
                title={`${label} — ${LEVEL_LABELS[level]}`}
                className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-colors duration-300 ${LEVEL_STYLES[level]}`}
              >
                <Icon className="h-4 w-4" />
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}