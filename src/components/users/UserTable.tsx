import { Pencil } from "lucide-react";
import type { AppUser } from "@/types/user";
import type { Role } from "@/types/role";
import UserStatusBadge from "./UserStatusBadge";

interface UserTableProps {
  users: AppUser[];
  roles: Role[];
  loading: boolean;
  canManage: boolean;
  onEdit: (user: AppUser) => void;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default function UserTable({ users, roles, loading, canManage, onEdit }: UserTableProps) {
  const roleName = (roleId: string) => roles.find((r) => r.id === roleId)?.name ?? "—";

  if (loading) {
    return (
      <div className="rounded-2xl border border-navy/10 bg-white p-12 text-center text-sm text-steel">
        Cargando usuarios...
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="rounded-2xl border border-navy/10 bg-white p-12 text-center">
        <p className="font-display text-lg font-bold text-navy">No hay usuarios todavía</p>
        <p className="mt-1 text-sm text-steel">Crea el primer usuario para esta filial.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-navy/10 bg-ash">
          <tr>
            <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">
              Usuario
            </th>
            <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">
              Rol
            </th>
            <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">
              Estado
            </th>
            {canManage && <th className="px-6 py-3" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-navy/5">
          {users.map((u) => (
            <tr key={u.id} className="transition hover:bg-ash/60">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-light font-mono text-xs font-semibold text-blue">
                    {getInitials(u.full_name)}
                  </span>
                  <div>
                    <p className="font-medium text-navy">{u.full_name}</p>
                    <p className="text-xs text-steel">{u.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-steel">{roleName(u.role_id)}</td>
              <td className="px-6 py-4">
                <UserStatusBadge status={u.status} />
              </td>
              {canManage && (
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => onEdit(u)}
                    aria-label={`Editar ${u.full_name}`}
                    className="rounded-lg p-2 text-steel transition hover:bg-blue-light hover:text-blue"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}