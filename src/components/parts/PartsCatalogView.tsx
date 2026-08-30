"use client";

import { useMemo, useState } from "react";
import { Plus, Search, X, Loader2, Upload, AlertTriangle, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useParts } from "@/hooks/useParts";
import BulkImportPartsModal from "./BulkImportPartsModal";

export default function PartsCatalogView() {
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;

  const [search, setSearch] = useState("");
  const { parts, loading, addPart, editPart, bulkAddParts } = useParts(filialId, search || undefined);
  const [panelOpen, setPanelOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("0");
  const [minStock, setMinStock] = useState("10");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const lowStockParts = useMemo(() => parts.filter((p) => p.stock_quantity <= p.min_stock), [parts]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!filialId || !code || !name || !price) return;
    setSubmitting(true);
    setError(null);
    try {
      await addPart({
        filial_id: filialId,
        code,
        name,
        price: Number(price),
        stock_quantity: Number(stockQuantity) || 0,
        min_stock: Number(minStock) || 10,
      });
      setCode("");
      setName("");
      setPrice("");
      setStockQuantity("0");
      setMinStock("10");
      setPanelOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el repuesto.");
    } finally {
      setSubmitting(false);
    }
  }

  function startEditingStock(partId: string, currentQuantity: number) {
    setEditingId(partId);
    setEditValue(String(currentQuantity));
  }

  async function saveStock(partId: string) {
    const qty = Number(editValue);
    if (Number.isNaN(qty) || qty < 0) return;
    await editPart(partId, { stock_quantity: qty });
    setEditingId(null);
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-navy">Catálogo de Repuestos</h1>
          <p className="mt-1 text-sm text-steel">Precios y disponibilidad para venta al público</p>
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
            onClick={() => setPanelOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy"
          >
            <Plus className="h-4 w-4" />
            Nuevo repuesto
          </button>
        </div>
      </div>

      {lowStockParts.length > 0 && (
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <span className="font-semibold">
              {lowStockParts.length} repuesto{lowStockParts.length > 1 ? "s" : ""}
            </span>{" "}
            {lowStockParts.length > 1 ? "necesitan" : "necesita"} restock:{" "}
            {lowStockParts.map((p) => p.name).join(", ")}
          </span>
        </div>
      )}

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
        <span className="whitespace-nowrap text-sm text-steel">{parts.length} repuestos</span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
        {loading ? (
          <div className="p-12 text-center text-sm text-steel">Cargando catálogo...</div>
        ) : parts.length === 0 ? (
          <div className="p-12 text-center text-sm text-steel">No hay repuestos en el catálogo.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-navy/10 bg-ash">
              <tr>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">
                  Código
                </th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">
                  Nombre
                </th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">
                  PVP
                </th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">
                  Cantidad
                </th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">
                  Disponibilidad
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {parts.map((p) => {
                const isLow = p.stock_quantity <= p.min_stock;
                const isEditing = editingId === p.id;
                return (
                  <tr key={p.id} className="transition hover:bg-ash/60">
                    <td className="px-6 py-4 font-mono text-blue">{p.code}</td>
                    <td className="px-6 py-4 font-medium text-navy">{p.name}</td>
                    <td className="px-6 py-4 text-navy">${p.price.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveStock(p.id);
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            className="w-20 rounded-lg border border-navy/15 px-2 py-1 text-sm outline-none focus:border-blue"
                          />
                          <button
                            onClick={() => saveStock(p.id)}
                            aria-label="Guardar"
                            className="rounded p-1 text-emerald-600 hover:bg-emerald-50"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            aria-label="Cancelar"
                            className="rounded p-1 text-red-500 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditingStock(p.id, p.stock_quantity)}
                          className={`flex items-center gap-1.5 font-semibold ${
                            isLow ? "text-red-600" : "text-navy"
                          }`}
                          title="Click para ajustar el stock"
                        >
                          {isLow && <AlertTriangle className="h-3.5 w-3.5" />}
                          {p.stock_quantity}
                          <span className="font-mono text-[10px] font-normal text-steel">
                            (mín. {p.min_stock})
                          </span>
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`font-semibold ${
                          p.availability === "disponible" ? "text-emerald-600" : "text-red-500"
                        }`}
                      >
                        {p.availability === "disponible" ? "Disponible" : "Agotado"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div
        className={`fixed inset-0 z-50 transition ${panelOpen ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!panelOpen}
      >
        <div
          onClick={() => setPanelOpen(false)}
          className={`absolute inset-0 bg-navy/40 transition-opacity ${panelOpen ? "opacity-100" : "opacity-0"}`}
        />
        <aside
          className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ${
            panelOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-navy/10 px-8 py-5">
            <h2 className="font-display text-xl font-bold text-navy">Nuevo repuesto</h2>
            <button
              onClick={() => setPanelOpen(false)}
              aria-label="Cerrar"
              className="rounded-lg p-2 text-steel hover:bg-ash hover:text-navy"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="flex-1 space-y-5 overflow-y-auto p-8">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">Código</label>
              <input
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="08880-83840"
                className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">Nombre</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Aceite motor 5W-30 (L)"
                className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">PVP</label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="9.50"
                className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy">Cantidad inicial</label>
                <input
                  type="number"
                  min="0"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy">Mínimo para alerta</label>
                <input
                  type="number"
                  min="0"
                  value={minStock}
                  onChange={(e) => setMinStock(e.target.value)}
                  className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
                />
              </div>
            </div>
            <p className="text-xs text-steel">
              Cuando la cantidad baje a este mínimo o menos, el repuesto aparece en la alerta de
              restock arriba del catálogo.
            </p>
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Crear repuesto
            </button>
          </form>
        </aside>
      </div>

      <BulkImportPartsModal open={bulkOpen} onClose={() => setBulkOpen(false)} onImport={bulkAddParts} />
    </div>
  );
}