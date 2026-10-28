import { Building2, Phone, Mail, UserRound, ArrowUpRight } from "lucide-react";
import type { Supplier } from "@/types/administracion";
import { formatVenezuelanPhone } from "@/lib/format";
const TYPES: Record<string, string> = {
  fabricante: "Fabricante",
  nacional: "Nacional",
  importador: "Importador",
};
export default function SupplierCard({
  supplier,
  onView,
}: {
  supplier: Supplier;
  onView: () => void;
}) {
  return (
    <article className="flex min-w-0 flex-col rounded-2xl border border-navy/10 bg-white p-5 shadow-sm transition hover:border-blue/25 hover:shadow-md">
      <header className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-light text-blue">
          <Building2 aria-hidden="true" className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2>
            <button
              type="button"
              onClick={onView}
              className="line-clamp-2 break-words text-left font-display text-lg font-bold text-navy hover:text-blue focus-visible:outline-blue"
              title={supplier.business_name}
            >
              {supplier.business_name}
            </button>
          </h2>
          <p className="mt-1 break-all font-mono text-xs text-steel">
            {supplier.rif}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${supplier.status === "activo" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
        >
          {supplier.status === "activo" ? "Activo" : "Inactivo"}
        </span>
      </header>
      <div className="mt-4 flex min-h-7 flex-wrap items-center gap-2">
        <span className="rounded-full bg-blue-light px-2.5 py-1 text-xs font-medium text-blue">
          {TYPES[supplier.supplier_type] ?? supplier.supplier_type}
        </span>
        {supplier.trade_name && (
          <span
            className="truncate text-xs text-steel"
            title={supplier.trade_name}
          >
            {supplier.trade_name}
          </span>
        )}
      </div>
      <dl className="my-5 flex-1 space-y-3 border-t border-navy/5 pt-4 text-sm text-steel">
        {[
          {
            icon: UserRound,
            label: "Contacto",
            value: supplier.contact_person || "Sin contacto registrado",
          },
          {
            icon: Phone,
            label: "Teléfono",
            value: supplier.phone
              ? formatVenezuelanPhone(supplier.phone)
              : "Sin teléfono",
          },
          {
            icon: Mail,
            label: "Correo",
            value: supplier.email || "Sin correo registrado",
          },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-2.5">
            <dt>
              <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
              <span className="sr-only">{label}</span>
            </dt>
            <dd className="truncate" title={value}>
              {value}
            </dd>
          </div>
        ))}
      </dl>
      <footer className="border-t border-navy/5 pt-4">
        <button
          type="button"
          onClick={onView}
          aria-label={`Ver información de ${supplier.business_name}`}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-navy/15 px-4 py-2.5 text-sm font-semibold text-blue transition hover:bg-blue-light"
        >
          Ver proveedor
          <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
        </button>
      </footer>
    </article>
  );
}
