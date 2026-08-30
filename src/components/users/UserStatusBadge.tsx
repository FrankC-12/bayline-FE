import type { UserStatus } from "@/types/user";

const STYLES: Record<UserStatus, string> = {
  activo: "bg-emerald-100 text-emerald-700",
  invitado: "bg-amber-100 text-amber-700",
  inactivo: "bg-slate-100 text-slate-500",
};

const LABELS: Record<UserStatus, string> = {
  activo: "Activo",
  invitado: "Invitado",
  inactivo: "Inactivo",
};

export default function UserStatusBadge({ status }: { status: UserStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}