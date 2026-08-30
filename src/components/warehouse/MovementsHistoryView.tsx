"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWarehouses } from "@/hooks/useWarehouses";
import { useParts } from "@/hooks/useParts";
import { useUsers } from "@/hooks/useUser";
import { listMovements } from "@/lib/api/warehouse";
import type { MovementType, StockMovement } from "@/types/warehouse";

const TYPE_TABS: { value: MovementType | "todos"; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "entrada", label: "Entrada" },
  { value: "salida", label: "Salida" },
  { value: "transferencia_salida", label: "Transferencia" },
  { value: "devolucion", label: "Devolución" },
];

const TYPE_LABELS: Record<MovementType, string> = {
  entrada: "Entrada",
  salida: "Salida",
  transferencia_salida: "Transferencia",
  transferencia_entrada: "Transferencia",
  devolucion: "Devolución",
};

const TYPE_STYLES: Record<MovementType, string> = {
  entrada: "bg-emerald-100 text-emerald-700",
  salida: "bg-slate-100 text-slate-600",
  transferencia_salida: "bg-blue-light text-blue",
  transferencia_entrada: "bg-blue-light text-blue",
  devolucion: "bg-red-100 text-red-700",
};

function signedQuantity(movement: StockMovement): string {
  const inbound = movement.movement_type === "entrada" || movement.movement_type === "transferencia_entrada";
  return `${inbound ? "+" : "-"}${movement.quantity}`;
}

export default function MovementsHistoryView() {
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;

  const { warehouses } = useWarehouses(filialId);
  const { parts } = useParts(filialId);
  const { users } = useUsers({ filialId });

  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<MovementType | "todos">("todos");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!filialId) return;
    setLoading(true);
    listMovements(filialId).then((data) => {
      setMovements(data);
      setLoading(false);
    });
  }, [filialId]);

  const partById = (id: string) => parts.find((p) => p.id === id);
  const warehouseName = (id: string) => warehouses.find((w) => w.id === id)?.name ?? "—";
  const userName = (id: string | null) => (id ? users.find((u) => u.id === id)?.full_name ?? "—" : "—");

  const filtered = movements.filter((m) => {
    if (typeFilter !== "todos") {
      if (typeFilter === "transferencia_salida") {
        if (m.movement_type !== "transferencia_salida" && m.movement_type !== "transferencia_entrada") return false;
      } else if (m.movement_type !== typeFilter) {
        return false;
      }
    }
    if (search) {
      const term = search.toLowerCase();
      const part = partById(m.part_id);
      const matchesPart = part && (part.name.toLowerCase().includes(term) || part.code.toLowerCase().includes(term));
      const matchesUser = userName(m.responsible_user_id).toLowerCase().includes(term);
      if (!matchesPart && !matchesUser) return false;
    }
    return true;
  });

  const isOutbound = (type: MovementType) => type === "salida" || type === "transferencia_salida" || type === "devolucion";

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-navy">Historial de Movimientos</h1>
      <p className="mt-1 text-sm text-steel">Entradas, salidas, transferencias y devoluciones de inventario</p>

      <div className="mt-6 mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por repuesto o responsable..."
            className="w-full rounded-full border border-navy/15 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
          />
        </div>
        <div className="flex rounded-full border border-navy/15 p-1">
          {TYPE_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setTypeFilter(tab.value)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                typeFilter === tab.value ? "bg-navy text-white" : "text-steel"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-navy/10 bg-white">
        {loading ? (
          <div className="p-12 text-center text-sm text-steel">Cargando movimientos...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-steel">No hay movimientos que coincidan.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-navy/10 bg-ash">
              <tr>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Fecha</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Tipo</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Repuesto / Cant.</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Almacén</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Referencia</th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Responsable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {filtered.map((m) => {
                const part = partById(m.part_id);
                return (
                  <tr key={m.id} className="transition hover:bg-ash/60">
                    <td className="px-6 py-4 text-steel">{new Date(m.created_at).toLocaleDateString("es-VE")}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest ${TYPE_STYLES[m.movement_type]}`}
                      >
                        {TYPE_LABELS[m.movement_type]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-navy">{part?.name ?? "—"}</span>{" "}
                      <span className={isOutbound(m.movement_type) ? "text-red-500" : "text-emerald-600"}>
                        {signedQuantity(m)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-steel">{warehouseName(m.warehouse_id)}</td>
                    <td className="px-6 py-4 text-steel">{m.reference ?? m.note ?? "—"}</td>
                    <td className="px-6 py-4 text-steel">{userName(m.responsible_user_id)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}