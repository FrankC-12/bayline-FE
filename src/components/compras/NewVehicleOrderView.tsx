"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Plus, X, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useVehiclePurchaseOrders } from "@/hooks/useVehiclePurchaseOrders";

interface LineDraft {
  brand: string;
  model: string;
  version: string;
  year: string;
  color: string;
  quantity: string;
}

function emptyLine(): LineDraft {
  return { brand: "", model: "", version: "", year: String(new Date().getFullYear()), color: "", quantity: "1" };
}

export default function NewVehicleOrderView() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;

  const { suppliers } = useSuppliers(filialId);
  const importersAndBrands = suppliers.filter((s) => s.supplier_type === "importador" || s.supplier_type === "fabricante");
  const { addOrder } = useVehiclePurchaseOrders(filialId);

  const [supplierId, setSupplierId] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([emptyLine()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateLine(index: number, patch: Partial<LineDraft>) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  async function handleSubmit() {
    if (!filialId) return;
    const validLines = lines.filter((l) => l.brand.trim() && l.model.trim() && Number(l.year) > 0 && Number(l.quantity) > 0);
    if (!supplierId || validLines.length === 0) {
      setError("Selecciona un proveedor y al menos una línea con marca, modelo, año y cantidad.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const created = await addOrder({
        filial_id: filialId,
        supplier_id: supplierId,
        lines: validLines.map((l) => ({
          brand: l.brand.trim(),
          model: l.model.trim(),
          version: l.version.trim() || null,
          year: Number(l.year),
          color: l.color.trim() || null,
          quantity: Number(l.quantity),
        })),
      });
      router.push(`/dashboard/compras/vehiculos/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la orden de compra.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!filialId) return null;

  return (
    <div>
      <Link
        href="/dashboard/compras/vehiculos"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-steel hover:text-navy"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver a órdenes de compra
      </Link>

      <p className="font-display text-sm font-bold uppercase tracking-wide text-blue">Nueva orden de compra</p>
      <h1 className="mb-6 font-display text-3xl font-bold text-navy">Compra de vehículos</h1>

      <div className="max-w-3xl space-y-5">
        <div className="rounded-2xl border border-navy/10 bg-white p-6">
          <label className="mb-1.5 block text-sm font-medium text-navy">Importador / Marca</label>
          <select
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
          >
            <option value="">Selecciona un proveedor...</option>
            {importersAndBrands.map((s) => (
              <option key={s.id} value={s.id}>
                {s.business_name}
              </option>
            ))}
          </select>
          {importersAndBrands.length === 0 && (
            <p className="mt-2 text-xs text-steel">
              No hay proveedores de tipo Importador o Fabricante registrados todavía.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-navy/10 bg-white p-6">
          <p className="mb-3 font-display text-sm font-bold text-navy">Líneas del pedido</p>
          <div className="space-y-3">
            {lines.map((line, i) => (
              <div key={i} className="grid grid-cols-12 items-center gap-2">
                <input
                  value={line.brand}
                  onChange={(e) => updateLine(i, { brand: e.target.value })}
                  placeholder="Marca"
                  className="col-span-2 rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none focus:border-blue"
                />
                <input
                  value={line.model}
                  onChange={(e) => updateLine(i, { model: e.target.value })}
                  placeholder="Modelo"
                  className="col-span-2 rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none focus:border-blue"
                />
                <input
                  value={line.version}
                  onChange={(e) => updateLine(i, { version: e.target.value })}
                  placeholder="Versión"
                  className="col-span-2 rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none focus:border-blue"
                />
                <input
                  type="number"
                  value={line.year}
                  onChange={(e) => updateLine(i, { year: e.target.value })}
                  placeholder="Año"
                  className="col-span-2 rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none focus:border-blue"
                />
                <input
                  value={line.color}
                  onChange={(e) => updateLine(i, { color: e.target.value })}
                  placeholder="Color"
                  className="col-span-2 rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none focus:border-blue"
                />
                <input
                  type="number"
                  min="1"
                  value={line.quantity}
                  onChange={(e) => updateLine(i, { quantity: e.target.value })}
                  placeholder="Cant."
                  className="col-span-1 rounded-xl border border-navy/15 px-3 py-2.5 text-center text-sm outline-none focus:border-blue"
                />
                <button
                  type="button"
                  onClick={() => setLines((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev))}
                  className="col-span-1 rounded-xl border border-navy/15 p-2.5 text-red-500 transition hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setLines((prev) => [...prev, emptyLine()])}
            className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-blue hover:text-navy"
          >
            <Plus className="h-4 w-4" />
            Agregar línea
          </button>
        </div>

        {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="flex items-center justify-center gap-2 rounded-full bg-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-50"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Crear orden de compra
        </button>
      </div>
    </div>
  );
}
