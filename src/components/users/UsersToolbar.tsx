"use client";

import { Search, Plus } from "lucide-react";
import type { Role } from "@/types/role";
import type { UserStatus } from "@/types/user";

interface UsersToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  roleFilter: string;
  onRoleFilterChange: (value: string) => void;
  statusFilter: UserStatus | "todos";
  onStatusFilterChange: (value: UserStatus | "todos") => void;
  roles: Role[];
  canCreate: boolean;
  onCreateClick: () => void;
}

export default function UsersToolbar({
  search,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  statusFilter,
  onStatusFilterChange,
  roles,
  canCreate,
  onCreateClick,
}: UsersToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nombre o correo"
            className="w-full rounded-xl border border-navy/15 bg-white py-2.5 pl-9 pr-4 text-sm text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/20"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => onRoleFilterChange(e.target.value)}
          className="rounded-xl border border-navy/15 bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/20"
        >
          <option value="todos">Todos los roles</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value as UserStatus | "todos")}
          className="rounded-xl border border-navy/15 bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/20"
        >
          <option value="todos">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="invitado">Invitado</option>
          <option value="inactivo">Inactivo</option>
        </select>
      </div>

      {canCreate && (
        <button
          onClick={onCreateClick}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy"
        >
          <Plus className="h-4 w-4" />
          Nuevo usuario
        </button>
      )}
    </div>
  );
}