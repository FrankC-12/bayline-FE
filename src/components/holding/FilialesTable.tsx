import { Pencil, Power, PowerOff, UserPlus } from "lucide-react";
import type { Filial } from "@/types/filial";

interface FilialesTableProps {
  filiales: Filial[];
  loading: boolean;
  onEdit: (filial: Filial) => void;
  onToggleActive: (filial: Filial) => void;
  onCreateUser: (filial: Filial) => void;
}

export default function FilialesTable({
  filiales,
  loading,
  onEdit,
  onToggleActive,
  onCreateUser,
}: FilialesTableProps) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-navy/10 bg-white p-12 text-center text-sm text-steel">
        Cargando filiales...
      </div>
    );
  }

  if (filiales.length === 0) {
    return (
      <div className="rounded-2xl border border-navy/10 bg-white p-12 text-center">
        <p className="font-display text-lg font-bold text-navy">No hay filiales todavía</p>
        <p className="mt-1 text-sm text-steel">Crea la primera filial de tu holding.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-navy/10 bg-ash">
          <tr>
            <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">
              Filial
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
          {filiales.map((f) => (
            <tr key={f.id} className="transition hover:bg-ash/60">
              <td className="px-6 py-4 font-medium text-navy">{f.name}</td>
              <td className="px-6 py-4 font-mono text-xs text-steel">{f.slug}</td>
              <td className="px-6 py-4">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest ${
                    f.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {f.is_active ? "Activo" : "Inactivo"}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-1">
                  <button
                    onClick={() => onCreateUser(f)}
                    aria-label={`Crear administrador para ${f.name}`}
                    title="Crear Súper Administrador"
                    className="rounded-lg p-2 text-steel transition hover:bg-blue-light hover:text-blue"
                  >
                    <UserPlus className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onEdit(f)}
                    aria-label={`Editar ${f.name}`}
                    className="rounded-lg p-2 text-steel transition hover:bg-blue-light hover:text-blue"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onToggleActive(f)}
                    aria-label={f.is_active ? `Desactivar ${f.name}` : `Activar ${f.name}`}
                    className="rounded-lg p-2 text-steel transition hover:bg-blue-light hover:text-blue"
                  >
                    {f.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
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