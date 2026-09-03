"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useWarehouseScope } from "@/contexts/WarehouseContext";
import { useParts } from "@/hooks/useParts";
import { listLots } from "@/lib/api/warehouse";
import type { PartLot } from "@/types/warehouse";
import type { Part } from "@/types/parts";

export default function LotsSystemView() {
  const { filialId, activeWarehouse, activeWarehouseId } = useWarehouseScope();

  const { parts } = useParts(filialId);
  const [search, setSearch] = useState("");
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [lots, setLots] = useState<PartLot[]>([]);
  const [loading, setLoading] = useState(false);

  const results = search && !selectedPart
    ? parts.filter((p) => p.code.toLowerCase().includes(search.toLowerCase()) || p.name.toLowerCase().includes(search.toLowerCase())).slice(0, 6)
    : [];

  useEffect(() => {
    if (!filialId || !selectedPart) {
      setLots([]);
      return;
    }
    setLoading(true);
    listLots(filialId, selectedPart.id, activeWarehouseId ?? undefined).then((data) => {
      setLots(data);
      setLoading(false);
    });
  }, [activeWarehouseId, filialId, selectedPart]);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-navy">Sistema de Lotes</h1>
      <p className="mt-1 text-sm text-steel">
        {activeWarehouse
          ? `Lotes FIFO de ${activeWarehouse.name} · el lote de menor número se consume primero`
          : "Selecciona o crea un almacén en la barra izquierda"}
      </p>

      <div className="mt-6 flex items-center gap-3">
        <span className="whitespace-nowrap text-sm font-medium text-navy">Repuesto:</span>
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedPart(null);
            }}
            placeholder="Buscar por código o nombre..."
            className="w-full rounded-xl border border-navy/15 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
          />
          {results.length > 0 && (
            <div className="absolute z-10 mt-1 w-full divide-y divide-navy/5 rounded-xl border border-navy/10 bg-white shadow-lg">
              {results.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setSelectedPart(p);
                    setSearch("");
                  }}
                  className="block w-full px-4 py-2 text-left text-sm hover:bg-ash"
                >
                  <span className="font-mono text-blue">{p.code}</span> {p.name}
                </button>
              ))}
            </div>
          )}
        </div>
        {selectedPart && (
          <span className="whitespace-nowrap rounded-full bg-blue-light px-4 py-2 text-sm font-semibold text-blue">
            {selectedPart.code} — {selectedPart.name}
          </span>
        )}
      </div>

      {selectedPart && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-navy/10 bg-white">
          {loading ? (
            <div className="p-12 text-center text-sm text-steel">Cargando lotes...</div>
          ) : lots.length === 0 ? (
            <div className="p-12 text-center text-sm text-steel">Este repuesto no tiene lotes registrados.</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-navy/10 bg-ash">
                <tr>
                  <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Lote</th>
                  <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Costo unitario</th>
                  <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Cant. inicial</th>
                  <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Cant. disponible</th>
                  <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/5">
                {lots.map((lot) => (
                  <tr key={lot.id} className="transition hover:bg-ash/60">
                    <td className="px-6 py-4 font-mono font-semibold text-blue">{lot.code}</td>
                    <td className="px-6 py-4 text-navy">${lot.unit_cost.toFixed(2)}</td>
                    <td className="px-6 py-4 text-navy">{lot.quantity_received}</td>
                    <td className="px-6 py-4 text-navy">{lot.quantity_remaining}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest ${
                          lot.quantity_remaining > 0 ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {lot.quantity_remaining > 0 ? "Activo" : "Agotado"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
