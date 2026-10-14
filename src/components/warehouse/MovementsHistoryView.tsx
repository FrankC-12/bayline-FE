"use client";

import { formatCount } from "@/lib/format";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useWarehouseScope } from "@/contexts/WarehouseContext";
import { useListLoader } from "@/hooks/useListLoader";
import ErrorState from "@/components/common/ErrorState";
import { listMovementPage, type MovementPage } from "@/lib/api/warehouse";
import type { MovementType, StockMovement } from "@/types/warehouse";
import EmptyState from "@/components/common/EmptyState";

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
  return `${inbound ? "+" : "-"}${formatCount(movement.quantity)}`;
}

export default function MovementsHistoryView() {
  const { filialId, activeWarehouse, activeWarehouseId } = useWarehouseScope();
  const [typeFilter, setTypeFilter] = useState<MovementType | "todos">("todos");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [pageSize, setPageSize] = useState(50);
  const filterScope = JSON.stringify([filialId, activeWarehouseId, typeFilter, debouncedSearch, dateFrom, dateTo, pageSize]);
  const [selection, setSelection] = useState({scope: filterScope, page: 1});
  const page = selection.scope === filterScope ? selection.page : 1;
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => clearTimeout(timer);
  }, [search]);
  const {data, loading, error, refresh} = useListLoader<MovementPage>(
    () => filialId ? listMovementPage(filialId, {
      page, page_size: pageSize, warehouse_id: activeWarehouseId ?? undefined,
      movement_type: typeFilter === "todos" ? undefined : typeFilter === "transferencia_salida" ? "transferencia" : typeFilter,
      search: debouncedSearch, date_from: dateFrom, date_to: dateTo,
    }).then((result) => [result]) : Promise.resolve([]),
    [filterScope, page],
    30000,
  );
  const result = data[0];
  const filtered = result?.items ?? [];
  const actualPage = result?.page ?? page;
  const totalPages = result?.total_pages ?? 1;
  const total = result?.total ?? 0;
  const changePage = (next: number) => setSelection({scope: filterScope, page: next});

  const isOutbound = (type: MovementType) => type === "salida" || type === "transferencia_salida" || type === "devolucion";

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-navy">Historial de Movimientos</h1>
      <p className="mt-1 text-sm text-steel">
        {activeWarehouse
          ? `Entradas, salidas, transferencias y devoluciones de ${activeWarehouse.name}`
          : "Selecciona o crea un almacén en la barra izquierda"}
      </p>

      <div className="mt-6 mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            maxLength={120}
            placeholder="Buscar por repuesto, responsable o referencia..."
            className="w-full rounded-full border border-navy/15 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
          />
        </div>
        <label className="text-xs text-steel">Desde<input aria-label="Fecha inicial" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="ml-2 rounded-lg border border-navy/15 bg-white p-2 text-sm" /></label>
        <label className="text-xs text-steel">Hasta<input aria-label="Fecha final" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="ml-2 rounded-lg border border-navy/15 bg-white p-2 text-sm" /></label>
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
        ) : error ? (
          <ErrorState error={error} onRetry={refresh} />
        ) : filtered.length === 0 ? (
          <EmptyState
            compact
            title={
              search || typeFilter !== "todos"
                ? "Sin movimientos que coincidan con el filtro."
                : "No hay movimientos registrados."
            }
          />
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
                return (
                  <tr key={m.id} className="transition hover:bg-ash/60">
                    <td className="px-6 py-4 text-steel">{new Date(m.created_at).toLocaleDateString("es-VE", {timeZone: "America/Caracas"})}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest ${TYPE_STYLES[m.movement_type]}`}
                      >
                        {TYPE_LABELS[m.movement_type]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-navy">{m.part_name}</span>{" "}
                      <span className={isOutbound(m.movement_type) ? "text-red-500" : "text-emerald-600"}>
                        {signedQuantity(m)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-steel">{m.warehouse_name}</td>
                    <td className="px-6 py-4 text-steel">{m.reference ?? m.note ?? "—"}</td>
                    <td className="px-6 py-4 text-steel">{m.responsible_name ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {!loading && !error && <nav aria-label="Paginación de movimientos" className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-steel">
        <span>{formatCount(total)} movimientos · Página {actualPage} de {totalPages}</span>
        <div className="flex items-center gap-2">
          <label>Por página<select aria-label="Movimientos por página" value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))} className="ml-2 rounded-lg border border-navy/15 bg-white p-2"><option value={20}>20</option><option value={50}>50</option><option value={100}>100</option></select></label>
          <button type="button" disabled={actualPage <= 1} onClick={() => changePage(actualPage - 1)} className="rounded-full border border-navy/15 px-4 py-2 disabled:opacity-40">Anterior</button>
          <button type="button" disabled={actualPage >= totalPages} onClick={() => changePage(actualPage + 1)} className="rounded-full border border-navy/15 px-4 py-2 disabled:opacity-40">Siguiente</button>
        </div>
      </nav>}
    </div>
  );
}
