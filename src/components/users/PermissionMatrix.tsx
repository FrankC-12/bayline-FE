"use client";

import { MODULE_CATALOG } from "@/lib/module-catalog";
import type { UIAccessLevel } from "@/lib/permissions";

const LEVELS: { value: UIAccessLevel; label: string }[] = [
  { value: "sin_acceso", label: "Sin acceso" },
  { value: "ver", label: "Ver" },
  { value: "editar", label: "Editar" },
];

interface PermissionsMatrixProps {
  permissionMap: Record<string, UIAccessLevel>;
  defaultMap: Record<string, UIAccessLevel>;
  onChange: (moduleId: string, level: UIAccessLevel) => void;
}

export default function PermissionsMatrix({
  permissionMap,
  defaultMap,
  onChange,
}: PermissionsMatrixProps) {
  return (
    <div className="max-h-[420px] divide-y divide-navy/5 overflow-y-auto rounded-2xl border border-navy/10">
      {MODULE_CATALOG.map(({ id, label, icon: Icon }) => {
        const current = permissionMap[id] ?? "sin_acceso";
        const isCustom = current !== (defaultMap[id] ?? "sin_acceso");

        return (
          <div
            key={id}
            className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ash text-steel">
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-sm font-medium text-navy">{label}</span>
              {isCustom && (
                <span className="rounded-full bg-amber/15 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-amber">
                  Personalizado
                </span>
              )}
            </div>

            <div className="flex shrink-0 rounded-full border border-navy/15 p-0.5">
              {LEVELS.map((lvl) => (
                <button
                  key={lvl.value}
                  type="button"
                  onClick={() => onChange(id, lvl.value)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    current === lvl.value ? "bg-blue text-white" : "text-steel hover:text-navy"
                  }`}
                >
                  {lvl.label}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}