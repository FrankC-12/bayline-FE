"use client";

import { useMemo, useState } from "react";
import { Plus, Minus, Upload, Search, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { useWarehouseScope } from "@/contexts/WarehouseContext";
import { useInventory } from "@/hooks/useInventory";
import { listLots } from "@/lib/api/warehouse";
import StockInModal from "./StockInModal";
import StockOutModal from "./StockOutModal";
import BulkStockInModal from "./BulkStockInModal";
import type { PartLot } from "@/types/warehouse";

export default function InventoryDashboardView() {
  const { filialId, activeWarehouse, activeWarehouseId, createWarehouse } =
    useWarehouseScope();

  const [search, setSearch] = useState("");
  // Fetch the full, unfiltered inventory once so every warehouse card can show
  // its own item/low-stock counts at the same time, then filter client-side
  // for the table of the currently selected warehouse.
  const { inventory: allInventory, loading, refresh } = useInventory(filialId);

  const tableRows = useMemo(() => {
    return allInventory.filter((row) => {
      if (activeWarehouseId && row.warehouse_id !== activeWarehouseId) return false;
      if (search) {
        const term = search.toLowerCase();
        if (!row.part_code.toLowerCase().includes(term) && !row.part_name.toLowerCase().includes(term)) {
          return false;
        }
      }
      return true;
    });
  }, [allInventory, activeWarehouseId, search]);

  const [stockInOpen, setStockInOpen] = useState(false);
  const [stockOutOpen, setStockOutOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);

  const [expandedPartId, setExpandedPartId] = useState<string | null>(null);
  const [lotBreakdown, setLotBreakdown] = useState<PartLot[]>([]);

  const lowStockRows = tableRows.filter((row) => row.quantity <= row.min_stock);

  async function toggleBreakdown(partId: string) {
    if (expandedPartId === partId) {
      setExpandedPartId(null);
      return;
    }
    setExpandedPartId(partId);
    if (filialId && activeWarehouseId) {
      const lots = await listLots(filialId, partId, activeWarehouseId);
      setLotBreakdown(lots.filter((l) => l.quantity_remaining > 0));
    }
  }

  if (!filialId) return null;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-navy">Dashboard de Inventario</h1>
          <p className="mt-1 text-sm text-steel">Existencias por almacén · lote FIFO activo</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setBulkOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-navy/15 px-5 py-2.5 text-sm font-semibold text-navy transition hover:border-navy/40"
          >
            <Upload className="h-4 w-4" />
            Carga masiva
          </button>
          <button
            onClick={() => setStockInOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy"
          >
            <Plus className="h-4 w-4" />
            Registrar entrada
          </button>
          <button
            onClick={() => setStockOutOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-navy/15 px-5 py-2.5 text-sm font-semibold text-navy transition hover:border-navy/40"
          >
            <Minus className="h-4 w-4" />
            Registrar salida
          </button>
        </div>
      </div>

      {lowStockRows.length > 0 && activeWarehouse && (
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <a href="#tabla" className="flex items-center gap-2 font-semibold text-amber-700 underline">
            <AlertTriangle className="h-4 w-4" />
            {lowStockRows.length} repuestos con stock bajo en {activeWarehouse.name}
          </a>
        </div>
      )}

      {activeWarehouse ? (
        <div>
          <div className="mb-4 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por código o nombre de repuesto..."
                className="w-full rounded-full border border-navy/15 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
              />
            </div>
            <span className="whitespace-nowrap text-sm text-steel">{tableRows.length} repuestos</span>
          </div>

          <div id="tabla" className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
            {loading ? (
              <div className="p-12 text-center text-sm text-steel">Cargando inventario...</div>
            ) : tableRows.length === 0 ? (
              <div className="p-12 text-center text-sm text-steel">No hay existencias en este almacén.</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="border-b border-navy/10 bg-ash">
                  <tr>
                    <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Código</th>
                    <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Nombre</th>
                    <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Existencia</th>
                    <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Costo unit.</th>
                    <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Ubicación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy/5">
                  {tableRows.map((row) => {
                    const isLow = row.quantity <= row.min_stock;
                    const isExpanded = expandedPartId === row.part_id;
                    return (
                      <>
                        <tr key={row.part_id} className="transition hover:bg-ash/60">
                          <td className="px-6 py-4 font-mono text-blue">{row.part_code}</td>
                          <td className="px-6 py-4 font-medium text-navy">{row.part_name}</td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => toggleBreakdown(row.part_id)}
                              className={`flex items-center gap-1.5 font-semibold ${isLow ? "text-amber-600" : "text-navy"}`}
                            >
                              {isLow && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                              {row.quantity}
                              {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-navy">
                            {row.average_cost != null ? `$${row.average_cost.toFixed(2)}` : "—"}
                          </td>
                          <td className="px-6 py-4 text-steel">{row.location ?? "—"}</td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${row.part_id}-lots`}>
                            <td colSpan={5} className="bg-ash/50 px-6 py-3">
                              <div className="space-y-1">
                                {lotBreakdown.length === 0 ? (
                                  <p className="text-xs text-steel">Cargando lotes...</p>
                                ) : (
                                  lotBreakdown.map((lot) => (
                                    <div key={lot.id} className="flex items-center justify-between text-xs">
                                      <span className="font-mono text-blue">{lot.code}</span>
                                      <span className="text-steel">
                                        {lot.quantity_remaining} disponibles · ${lot.unit_cost.toFixed(2)} c/u
                                      </span>
                                    </div>
                                  ))
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-navy/20 bg-white p-12 text-center">
          <p className="font-display text-lg font-bold text-navy">Crea tu primer almacén</p>
          <p className="mt-1 text-sm text-steel">
            Usa el botón de la barra izquierda para comenzar a registrar inventario.
          </p>
        </div>
      )}

      <StockInModal
        open={stockInOpen}
        onClose={() => setStockInOpen(false)}
        filialId={filialId}
        warehouses={activeWarehouse ? [activeWarehouse] : []}
        defaultWarehouseId={activeWarehouseId ?? undefined}
        onSaved={refresh}
        onCreateWarehouse={createWarehouse}
      />
      <StockOutModal
        open={stockOutOpen}
        onClose={() => setStockOutOpen(false)}
        filialId={filialId}
        warehouses={activeWarehouse ? [activeWarehouse] : []}
        defaultWarehouseId={activeWarehouseId ?? undefined}
        onSaved={refresh}
        onCreateWarehouse={createWarehouse}
      />
      <BulkStockInModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        filialId={filialId}
        warehouses={activeWarehouse ? [activeWarehouse] : []}
        defaultWarehouseId={activeWarehouseId ?? undefined}
        onSaved={refresh}
        onCreateWarehouse={createWarehouse}
      />
    </div>
  );
}
