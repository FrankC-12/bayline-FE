"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSuppliers } from "@/hooks/useSuppliers";
import { usePurchaseRequests } from "@/hooks/usePurchaseRequests";
import CreateSupplierModal from "./CreateSuppliermodal";
import type { PurchaseRequestStatus } from "@/types/administracion";

const REQUEST_STATUS_LABELS: Record<PurchaseRequestStatus, string> = {
  enviada: "Enviada, esperando cotización",
  cotizada: "Cotizada",
  pagada: "Pagada",
  recibida: "Recibida",
  conciliada: "Conciliada",
  cancelada: "Cancelada",
};

const REQUEST_STATUS_STYLES: Record<PurchaseRequestStatus, string> = {
  enviada: "bg-slate-100 text-slate-600",
  cotizada: "bg-blue-light text-blue",
  pagada: "bg-amber-100 text-amber-700",
  recibida: "bg-emerald-100 text-emerald-700",
  conciliada: "bg-emerald-100 text-emerald-700",
  cancelada: "bg-red-100 text-red-700",
};

const SUPPLIER_TYPE_LABELS: Record<string, string> = {
  fabricante: "Fabricante",
  nacional: "Nacional",
  importador: "Importador",
};

export default function ComprasProveedoresView() {
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "proveedores" ? "proveedores" : "compras";
  const [tab, setTab] = useState<"compras" | "proveedores">(initialTab);

  useEffect(() => {
    setTab(searchParams.get("tab") === "proveedores" ? "proveedores" : "compras");
  }, [searchParams]);

  const [search, setSearch] = useState("");
  const { requests, loading: loadingRequests } = usePurchaseRequests(filialId, search || undefined);
  const { suppliers, loading: loadingSuppliers, addSupplier } = useSuppliers(filialId, tab === "proveedores" ? search || undefined : undefined);
  const supplierName = (id: string) => suppliers.find((s) => s.id === id)?.business_name ?? "—";

  const [createSupplierOpen, setCreateSupplierOpen] = useState(false);

  return (
    <div>
      <div className="mb-6 flex rounded-full border border-navy/15 p-1" style={{ width: "fit-content" }}>
        <button
          onClick={() => setTab("compras")}
          className={`rounded-full px-5 py-2 text-sm font-medium transition ${tab === "compras" ? "bg-navy text-white" : "text-steel"}`}
        >
          Compras
        </button>
        <button
          onClick={() => setTab("proveedores")}
          className={`rounded-full px-5 py-2 text-sm font-medium transition ${tab === "proveedores" ? "bg-navy text-white" : "text-steel"}`}
        >
          Proveedores
        </button>
      </div>

      {tab === "compras" ? (
        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
            <h1 className="font-display text-3xl font-bold text-navy">Historial de Compras a Proveedores</h1>
            <Link
              href="/dashboard/administracion/compras/nueva"
              className="inline-flex items-center gap-2 rounded-full bg-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy"
            >
              <Plus className="h-4 w-4" />
              Nueva solicitud de compra
            </Link>
          </div>
          <p className="mb-4 text-sm text-steel">Solicitudes de compra de repuestos a fabricantes y distribuidores</p>

          <div className="relative mb-4">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por N.º de solicitud, proveedor o código de repuesto..."
              className="w-full rounded-full border border-navy/15 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
            />
          </div>

          <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
            {loadingRequests ? (
              <div className="p-12 text-center text-sm text-steel">Cargando compras...</div>
            ) : requests.length === 0 ? (
              <div className="p-12 text-center text-sm text-steel">No hay solicitudes de compra todavía.</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="border-b border-navy/10 bg-ash">
                  <tr>
                    <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">N.º Solicitud</th>
                    <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Proveedor</th>
                    <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Fecha</th>
                    <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Estado</th>
                    <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Total cotizado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy/5">
                  {requests.map((r) => (
                    <tr key={r.id} className="cursor-pointer transition hover:bg-ash/60" onClick={() => router.push(`/dashboard/administracion/compras/${r.id}`)}>
                      <td className="px-6 py-4 font-mono font-semibold text-blue">{r.code}</td>
                      <td className="px-6 py-4 font-medium text-navy">{supplierName(r.supplier_id)}</td>
                      <td className="px-6 py-4 text-steel">{new Date(r.created_at).toLocaleDateString("es-VE")}</td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest ${REQUEST_STATUS_STYLES[r.status]}`}>
                          {REQUEST_STATUS_LABELS[r.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-navy">
                        {r.total_quoted != null ? `$${r.total_quoted.toFixed(2)}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
            <h1 className="font-display text-3xl font-bold text-navy">Proveedores</h1>
            <button
              onClick={() => setCreateSupplierOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy"
            >
              <Plus className="h-4 w-4" />
              Nuevo Proveedor
            </button>
          </div>
          <p className="mb-4 text-sm text-steel">Fabricantes, distribuidores nacionales e importadores registrados</p>

          <div className="mb-4 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por razón social o RIF..."
                className="w-full rounded-full border border-navy/15 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
              />
            </div>
            <span className="whitespace-nowrap text-sm text-steel">{suppliers.length} proveedores</span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-navy/10 bg-white">
            {loadingSuppliers ? (
              <div className="p-12 text-center text-sm text-steel">Cargando proveedores...</div>
            ) : suppliers.length === 0 ? (
              <div className="p-12 text-center text-sm text-steel">No hay proveedores registrados.</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="border-b border-navy/10 bg-ash">
                  <tr>
                    <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Razón social</th>
                    <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">RIF</th>
                    <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Tipo</th>
                    <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Persona de contacto</th>
                    <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Teléfono</th>
                    <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-steel">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy/5">
                  {suppliers.map((s) => (
                    <tr key={s.id} className="transition hover:bg-ash/60">
                      <td className="px-6 py-4 font-semibold text-navy">{s.business_name}</td>
                      <td className="px-6 py-4 font-mono text-steel">{s.rif}</td>
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-blue-light px-2.5 py-1 text-xs font-semibold text-blue">
                          {SUPPLIER_TYPE_LABELS[s.supplier_type]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-steel">{s.contact_person ?? "—"}</td>
                      <td className="px-6 py-4 text-steel">{s.phone ?? "—"}</td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${s.status === "activo" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                          {s.status === "activo" ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {filialId && (
        <CreateSupplierModal
          open={createSupplierOpen}
          onClose={() => setCreateSupplierOpen(false)}
          filialId={filialId}
          onSubmit={addSupplier}
        />
      )}
    </div>
  );
}