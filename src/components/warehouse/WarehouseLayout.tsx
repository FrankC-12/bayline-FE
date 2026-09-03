"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeftRight,
  Boxes,
  ChevronLeft,
  Clock,
  LayoutGrid,
  Loader2,
  Plus,
  Warehouse as WarehouseIcon,
  X,
} from "lucide-react";
import { WarehouseProvider, useWarehouseScope } from "@/contexts/WarehouseContext";

const NAV_ITEMS = [
  { href: "/dashboard/almacen", label: "Dashboard de Inventario", icon: LayoutGrid },
  { href: "/dashboard/almacen/movimientos", label: "Historial de Movimientos", icon: Clock },
  { href: "/dashboard/almacen/transferencias", label: "Órdenes de Transferencia", icon: ArrowLeftRight },
  { href: "/dashboard/almacen/lotes", label: "Sistema de Lotes", icon: Boxes },
];

function WarehouseLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { warehouses, activeWarehouseId, loading, selectWarehouse, createWarehouse } = useWarehouseScope();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function closeCreateModal() {
    if (submitting) return;
    setAdding(false);
    setName("");
    setError(null);
  }

  async function handleCreate() {
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await createWarehouse(name.trim());
      closeCreateModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el almacén.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-7xl gap-8 px-6 py-12">
      <aside className="w-64 shrink-0">
        <Link href="/dashboard" className="mb-4 flex items-center gap-1.5 text-sm font-medium text-steel hover:text-navy">
          <ChevronLeft className="h-4 w-4" />
          Volver al Dashboard
        </Link>
        <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-steel">Módulo</p>
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
                  active ? "bg-blue-light text-blue" : "text-steel hover:bg-ash hover:text-navy"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="my-6 border-t border-navy/10" />
        <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-steel">
          Almacén activo
        </p>
        <div className="space-y-2">
          {loading && <p className="px-3 py-2 text-xs text-steel">Cargando almacenes...</p>}
          {!loading && warehouses.length === 0 && (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
              No hay almacenes creados.
            </p>
          )}
          {warehouses.map((warehouse) => {
            const active = warehouse.id === activeWarehouseId;
            return (
              <button
                key={warehouse.id}
                type="button"
                onClick={() => selectWarehouse(warehouse.id)}
                className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-3 text-left text-sm font-semibold transition ${
                  active
                    ? "border-blue bg-blue text-white shadow-sm"
                    : "border-navy/10 bg-white text-navy hover:border-blue/40 hover:bg-blue-light"
                }`}
              >
                <WarehouseIcon className="h-4 w-4 shrink-0" />
                <span className="min-w-0 truncate">{warehouse.name}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex w-full items-center gap-2 rounded-xl border border-dashed border-navy/20 px-3 py-2.5 text-sm font-semibold text-blue transition hover:border-blue/40 hover:bg-blue-light"
          >
            <Plus className="h-4 w-4" /> Crear almacén
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">{children}</div>

      {adding && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-warehouse-title"
        >
          <button
            type="button"
            onClick={closeCreateModal}
            aria-label="Cerrar modal"
            className="absolute inset-0 bg-navy/45 backdrop-blur-[2px]"
          />
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void handleCreate();
            }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-navy/10 px-6 py-5">
              <div>
                <h2 id="create-warehouse-title" className="font-display text-xl font-bold text-navy">
                  Crear almacén
                </h2>
                <p className="mt-1 text-xs text-steel">
                  Aparecerá como una pestaña nueva en la barra lateral.
                </p>
              </div>
              <button
                type="button"
                onClick={closeCreateModal}
                disabled={submitting}
                aria-label="Cerrar"
                className="rounded-lg p-2 text-steel transition hover:bg-ash hover:text-navy disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <label htmlFor="warehouse-name" className="mb-1.5 block text-sm font-medium text-navy">
                Nombre del almacén
              </label>
              <input
                id="warehouse-name"
                autoFocus
                required
                maxLength={80}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ej. Repuestos, P2P o Principal"
                className="w-full rounded-xl border border-navy/15 px-4 py-3 text-sm outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/20"
              />
              {error && (
                <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-navy/10 bg-ash/50 px-6 py-4">
              <button
                type="button"
                onClick={closeCreateModal}
                disabled={submitting}
                className="rounded-full border border-navy/15 px-5 py-2.5 text-sm font-semibold text-navy transition hover:border-navy/40 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting || !name.trim()}
                className="flex min-w-36 items-center justify-center gap-2 rounded-full bg-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Crear almacén
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function AlmacenLayout({ children }: { children: React.ReactNode }) {
  return (
    <WarehouseProvider>
      <WarehouseLayoutContent>{children}</WarehouseLayoutContent>
    </WarehouseProvider>
  );
}
