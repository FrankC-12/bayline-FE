"use client";
/* eslint-disable @next/next/no-img-element -- Product photos are optional user uploads. */
import { useState } from "react";
import {
  ArrowUpRight,
  CarFront,
  MapPin,
  Package,
  Pencil,
  Power,
  PowerOff,
} from "lucide-react";
import type { Part } from "@/types/parts";
import { formatCount, formatMoney } from "@/lib/format";
interface Props {
  part: Part;
  canEdit: boolean;
  busy: boolean;
  onView: (part: Part) => void;
  onEdit: (part: Part) => void;
  onToggle: (part: Part) => void;
}
export default function PartCatalogCard({
  part,
  canEdit,
  busy,
  onView,
  onEdit,
  onToggle,
}: Props) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const available = part.is_active && part.stock_total > 0;
  const low = available && part.stock_total <= part.min_stock;
  const badge = !part.is_active
    ? "Inactivo"
    : !available
      ? "Agotado"
      : low
        ? "Stock bajo"
        : "Disponible";
  const badgeClass = !part.is_active
    ? "bg-slate-100 text-slate-600"
    : !available
      ? "bg-red-50 text-red-700"
      : low
        ? "bg-amber-50 text-amber-800"
        : "bg-emerald-50 text-emerald-800";
  const vehicle = part.vehicle_brand_name
    ? [part.vehicle_brand_name, part.vehicle_model_name]
        .filter(Boolean)
        .join(" ")
    : "Universal";
  const years =
    part.year_from || part.year_to
      ? `${part.year_from ?? "…"} – ${part.year_to ?? "…"}`
      : "Todos los años";
  return (
    <article
      className={`group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-sm transition duration-200 hover:border-blue/30 hover:shadow-md ${!part.is_active ? "bg-slate-50/50" : ""}`}
    >
      <button
        type="button"
        onClick={() => onView(part)}
        aria-label={`Ver detalle de ${part.name}, código ${part.code}`}
        className="absolute inset-0 z-10 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue"
      />
      <div className="relative flex h-44 items-center justify-center overflow-hidden border-b border-navy/5 bg-slate-50">
        {part.image_url && failedImage !== part.image_url ? (
          <img
            src={part.image_url}
            alt={part.name}
            loading="lazy"
            decoding="async"
            onError={() => setFailedImage(part.image_url ?? null)}
            className="h-full w-full object-contain p-5 transition duration-300 motion-safe:group-hover:scale-105"
          />
        ) : (
          <div aria-hidden="true" className="flex flex-col items-center gap-2">
            <span className="rounded-2xl border border-white bg-white/80 p-5 text-blue/65 shadow-sm">
              <Package strokeWidth={1.2} className="h-11 w-11" />
            </span>
            <span className="text-[11px] text-steel">Sin fotografía</span>
          </div>
        )}
        <span
          className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm ${badgeClass}`}
        >
          {badge}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex min-w-0 items-center justify-between gap-2">
          <span className="break-all font-mono text-[11px] font-semibold text-blue">
            {part.code}
          </span>
          <span className="max-w-[60%] rounded-md bg-slate-100 px-2 py-1 text-right text-[10px] font-medium text-steel">
            {part.category_name || "Sin categoría"}
          </span>
        </div>
        <h2 className="min-h-[2.75rem] break-words font-display text-base font-bold leading-snug text-navy">
          {part.name}
        </h2>
        <p className="mt-1 min-h-4 break-all text-[11px] text-steel">
          {part.manufacturer_part_number
            ? `N.º de parte: ${part.manufacturer_part_number}`
            : "Sin número de fabricante"}
        </p>
        <div className="my-4 flex flex-wrap items-end justify-between gap-3 border-b border-navy/5 pb-4">
          <div>
            <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-steel">
              Precio de referencia
            </p>
            <p
              className={`font-display font-bold tracking-tight ${part.reference_price == null ? "text-sm text-steel" : "text-2xl text-navy"}`}
            >
              {part.reference_price == null
                ? "Sin precio registrado"
                : `$${formatMoney(part.reference_price)}`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wide text-steel">
              Stock total
            </p>
            <p className="font-display text-xl font-bold text-navy">
              {formatCount(part.stock_total)}
              <span className="ml-1 text-[11px] font-normal text-steel">
                {part.unit}
              </span>
            </p>
          </div>
        </div>
        <dl className="space-y-3 text-xs">
          <div className="flex items-start gap-2">
            <CarFront
              aria-hidden="true"
              className="mt-0.5 h-4 w-4 shrink-0 text-steel"
            />
            <div className="min-w-0">
              <dt className="text-[10px] text-steel">Compatibilidad</dt>
              <dd className="break-words font-medium text-navy">
                {vehicle}
                <span className="mt-0.5 block text-[11px] font-normal text-steel">
                  {years}
                </span>
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin
              aria-hidden="true"
              className="h-4 w-4 shrink-0 text-steel"
            />
            <div className="min-w-0">
              <dt className="text-[10px] text-steel">Ubicación</dt>
              <dd className="break-words font-medium text-navy">
                {part.location || "Sin ubicación"}
              </dd>
            </div>
          </div>
        </dl>
        <div className="mt-4 flex items-center justify-between border-t border-navy/5 pt-3 text-[11px] text-steel">
          <span>
            Stock mínimo:{" "}
            <strong className="font-medium text-navy">
              {formatCount(part.min_stock)}
            </strong>
          </span>
          <span className="flex items-center gap-1 font-semibold text-blue">
            Ver detalle
            <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
      {canEdit && (
        <footer className="relative z-20 flex items-center justify-between gap-2 border-t border-navy/5 bg-slate-50/70 px-5 py-2.5">
          <button
            type="button"
            onClick={() => onEdit(part)}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-steel hover:bg-blue-light hover:text-blue focus-visible:outline-blue"
          >
            <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
            Editar
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onToggle(part)}
            aria-label={`${part.is_active ? "Desactivar" : "Activar"} ${part.name}`}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-steel hover:bg-blue-light hover:text-blue disabled:opacity-50"
          >
            {part.is_active ? (
              <PowerOff aria-hidden="true" className="h-3.5 w-3.5" />
            ) : (
              <Power aria-hidden="true" className="h-3.5 w-3.5" />
            )}
            {busy ? "Guardando…" : part.is_active ? "Desactivar" : "Activar"}
          </button>
        </footer>
      )}
    </article>
  );
}
