"use client";
/* eslint-disable @next/next/no-img-element -- Catalog images are uploaded by users. */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Pencil } from "lucide-react";
import Modal from "@/components/common/Modal";
import PartImagePicker from "./PartImagePicker";
import { uploadPartImage,removePartImage } from "@/lib/api/parts";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import { formatCount, formatMoney } from "@/lib/format";
import type { Part } from "@/types/parts";

interface PartDetailPanelProps {
  open: boolean;
  part: Part | null;
  onClose: () => void;
  onEdit: (part: Part) => void;
  onUpdated: (part:Part)=>void;
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="mb-1 font-mono text-[11px] uppercase tracking-widest text-steel">{label}</p>
      <p className="text-sm font-medium text-navy">{value}</p>
    </div>
  );
}

function compatibilityValue(part: Part): string {
  if (!part.vehicle_brand_name) return "Universal";
  const vehicle = [part.vehicle_brand_name, part.vehicle_model_name].filter(Boolean).join(" ");
  const years =
    part.year_from || part.year_to ? ` · ${part.year_from ?? "…"}-${part.year_to ?? "…"}` : "";
  return `${vehicle}${years}`;
}

export default function PartDetailPanel({open,part,onClose,onEdit,onUpdated}:PartDetailPanelProps) {
 const {canEdit}=useModuleAccess("repuestos");
 const [busy,setBusy]=useState(false);const lock=useRef(false);const [error,setError]=useState<string|null>(null);
 useEffect(()=>setError(null),[open,part?.id]);
 async function changeImage(file:File|null) {
  if(!part || !canEdit || lock.current)return;
  lock.current=true;setBusy(true);setError(null);
  try {const saved=await (file ? uploadPartImage(part.id,file) : removePartImage(part.id));onUpdated(saved);}
  catch(e){setError(e instanceof Error ? e.message : "No se pudo guardar la imagen.");}
  finally {lock.current=false;setBusy(false);}
 }
 return (<Modal open={open && !!part} onClose={onClose} title="Detalle del repuesto" size="lg" closeDisabled={busy} footer={<><button type="button" disabled={busy} onClick={onClose} className="rounded-full border border-navy/15 px-5 py-2 text-sm font-semibold text-navy">Cerrar</button>{canEdit && part && <button type="button" disabled={busy} onClick={()=>onEdit(part)} className="inline-flex items-center gap-2 rounded-full bg-blue px-5 py-2 text-sm font-semibold text-white"><Pencil aria-hidden="true" className="h-4 w-4"/>Editar repuesto</button>}</>}>
        {part && (
          <div className="space-y-5 p-5 sm:p-7">
            {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            {canEdit ? <PartImagePicker imageUrl={part.image_url} name={part.name} disabled={busy} onChange={file=>void changeImage(file)}/> : part.image_url && <div className="rounded-xl bg-slate-50 p-4">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={part.image_url} alt={`Imagen de ${part.name}`} className="mx-auto h-48 max-w-full object-contain"/></div>}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-lg font-bold text-blue">{part.code}</p>
                <p className="font-display text-lg font-bold text-navy">{part.name}</p>
              </div>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest ${
                  part.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                }`}
              >
                {part.is_active ? "Activo" : "Inactivo"}
              </span>
            </div>

            <Field label="Número de parte del fabricante" value={part.manufacturer_part_number ?? "—"} />
            <Field label="Categoría" value={part.category_name} />
            <Field label="Compatibilidad" value={compatibilityValue(part)} />

            <div className="grid grid-cols-2 gap-4">
              <Field label="Unidad" value={part.unit} />
              <Field label="Stock mínimo" value={formatCount(part.min_stock)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Stock total" value={formatCount(part.stock_total)} />
              <Field label="Ubicación" value={part.location ?? "—"} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Precio de referencia"
                value={part.reference_price === null ? "Sin costo registrado" : `$${formatMoney(part.reference_price)}`}
              />
              <Field
                label="Costo más reciente"
                value={part.latest_cost === null ? "—" : `$${formatMoney(part.latest_cost)}`}
              />
            </div>

            <p className="text-xs text-steel">
              El stock, el precio de referencia y la ubicación en almacén se calculan automáticamente desde
              los lotes de almacén y no se editan aquí.
            </p>
          </div>
        )}
    </Modal>
  );
}
