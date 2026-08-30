"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePartReturns } from "@/hooks/usePartReturns";
import { useParts } from "@/hooks/useParts";
import { useUsers } from "@/hooks/useUser";

const REASON_LABELS: Record<string, string> = {
  pedido_en_exceso: "Pedido en exceso",
  defectuoso: "Defectuoso",
  repuesto_incorrecto: "Repuesto incorrecto",
  otro: "Otro",
};

export default function PartReturnsListView() {
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;

  const [search, setSearch] = useState("");
  const { returns, loading } = usePartReturns(filialId);
  const { parts } = useParts(filialId);
  const { users } = useUsers({ filialId });

  const partName = (id: string) => parts.find((p) => p.id === id)?.name ?? "—";
  const responsibleName = (id: string) => users.find((u) => u.id === id)?.full_name ?? "—";

  const filtered = returns.filter((r) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return partName(r.part_id).toLowerCase().includes(term);
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-navy">Historial de Devoluciones</h1>
          <p className="mt-1 text-sm text-steel">Repuestos devueltos al almacén desde ODT ya cerradas</p>
        </div>
        <Link
          href="/dashboard/repuestos/devoluciones/nueva"
          className="inline-flex items-center gap-2 rounded-full bg-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy"
        >
          <Plus className="h-4 w-4" />
          Nueva devolución
        </Link>
      </div>

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por repuesto o número de devolución..."
          className="w-full rounded-full border border-navy/15 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
        {loading ? (
          <div className="p-12 text-center text-sm text-steel">Cargando devoluciones...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-steel">No hay devoluciones registradas.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-navy/10 bg-ash">
              <tr>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">
                  Fecha
                </th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">
                  Repuesto
                </th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">
                  Cant.
                </th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">
                  Origen
                </th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">
                  Destino
                </th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">
                  Motivo
                </th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">
                  Responsable
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {filtered.map((r) => (
                <tr key={r.id} className="transition hover:bg-ash/60">
                  <td className="px-6 py-4 text-steel">
                    {new Date(r.created_at).toLocaleDateString("es-VE")}
                  </td>
                  <td className="px-6 py-4 font-medium text-navy">{partName(r.part_id)}</td>
                  <td className="px-6 py-4 text-navy">{r.quantity}</td>
                  <td className="px-6 py-4 text-steel">{r.origin_warehouse}</td>
                  <td className="px-6 py-4 text-steel">{r.destination_warehouse}</td>
                  <td className="px-6 py-4 text-steel">{REASON_LABELS[r.reason]}</td>
                  <td className="px-6 py-4 text-steel">{responsibleName(r.responsible_user_id)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}