import { Pencil, Power, PowerOff, UserPlus } from "lucide-react";
import type { Holding } from "@/types/holding";

interface HoldingsTableProps {
  holdings: Holding[];
  loading: boolean;
  onEdit: (holding: Holding) => void;
  onToggleActive: (holding: Holding) => void;
  onCreateUser: (holding: Holding) => void;
}

export default function HoldingsTable({
  holdings,
  loading,
  onEdit,
  onToggleActive,
  onCreateUser,
}: HoldingsTableProps) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-navy/10 bg-white p-12 text-center text-sm text-steel">
        Cargando holdings...
      </div>
    );
  }

  if (holdings.length === 0) {
    return (
      <div className="rounded-2xl border border-navy/10 bg-white p-12 text-center">
        <p className="font-display text-lg font-bold text-navy">No hay holdings todavía</p>
        <p className="mt-1 text-sm text-steel">Crea el primero para empezar a dar de alta filiales.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-navy/10 bg-ash">
          <tr>
            <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">
              Holding
            </th>
            <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">
              Slug
            </th>
            <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">
              Estado
            </th>
            <th className="px-6 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-navy/5">
          {holdings.map((h) => (
            <tr key={h.id} className="transition hover:bg-ash/60">
              <td className="px-6 py-4 font-medium text-navy">{h.name}</td>
              <td className="px-6 py-4 font-mono text-xs text-steel">{h.slug}</td>
              <td className="px-6 py-4">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest ${
                    h.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {h.is_active ? "Activo" : "Inactivo"}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-1">
                  <button
                    onClick={() => onCreateUser(h)}
                    aria-label={`Crear usuario admin para ${h.name}`}
                    title="Crear usuario admin"
                    className="rounded-lg p-2 text-steel transition hover:bg-blue-light hover:text-blue"
                  >
                    <UserPlus className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onEdit(h)}
                    aria-label={`Editar ${h.name}`}
                    className="rounded-lg p-2 text-steel transition hover:bg-blue-light hover:text-blue"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onToggleActive(h)}
                    aria-label={h.is_active ? `Desactivar ${h.name}` : `Activar ${h.name}`}
                    className="rounded-lg p-2 text-steel transition hover:bg-blue-light hover:text-blue"
                  >
                    {h.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}