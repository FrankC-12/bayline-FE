"use client";

import { useEffect, useState } from "react";
import { Camera, Plus, Trash2, X } from "lucide-react";
import CreatableSelect from "@/components/concesionario/CreatableSelect";

export interface DamagePoint {
  id?: string;
  x: number;
  y: number;
  zone: string;
  kind: string;
  severity: string;
  description: string | null;
  photo_url?: string | null;
  /** A photo picked before the damage has a real id yet (still being
   * drafted in CreateInspectionPanel) — uploaded via uploadDamagePhoto once
   * the inspection is created and real damage ids come back. */
  pendingPhoto?: File | null;
}

interface VehicleDamageMapProps {
  damages: DamagePoint[];
  editable?: boolean;
  onChange?: (damages: DamagePoint[]) => void;
}

const DEFAULT_ZONES = [
  "capo", "techo", "maletero", "parachoques_delantero", "parachoques_trasero",
  "parabrisas", "luneta_trasera",
  "puerta_delantera_izquierda", "puerta_delantera_derecha",
  "puerta_trasera_izquierda", "puerta_trasera_derecha",
  "guardafango_delantero_izquierdo", "guardafango_delantero_derecho",
  "guardafango_trasero_izquierdo", "guardafango_trasero_derecho",
  "espejo_izquierdo", "espejo_derecho",
];
const DEFAULT_KINDS = ["rayon", "abolladura", "golpe", "oxido", "rotura", "faltante", "grieta", "desgaste"];
const DEFAULT_SEVERITIES = ["leve", "moderado", "grave"];

const SEVERITY_DOT: Record<string, string> = {
  leve: "bg-amber-400 border-amber-600",
  moderado: "bg-orange-500 border-orange-700",
  grave: "bg-red-600 border-red-800",
};

function dotStyle(severity: string): string {
  return SEVERITY_DOT[severity] ?? "bg-slate-400 border-slate-600";
}

function labelize(value: string): string {
  if (!value) return value;
  const text = value.replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** A simple schematic top-down car outline — not brand/pixel-accurate, just
 * enough visual context to place a point. Zone/kind/severity are chosen
 * explicitly from the dropdowns below, not derived from which shape was
 * tapped, so the diagram itself doesn't need labeled regions. */
function CarOutline() {
  return (
    <svg viewBox="0 0 100 200" className="h-full w-full">
      <rect x="18" y="14" width="64" height="172" rx="24" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.5" />
      <rect x="28" y="38" width="44" height="22" rx="4" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
      <rect x="26" y="62" width="48" height="60" rx="6" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
      <rect x="28" y="124" width="44" height="18" rx="4" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
      <rect x="9" y="46" width="9" height="14" rx="2" fill="#cbd5e1" />
      <rect x="82" y="46" width="9" height="14" rx="2" fill="#cbd5e1" />
      <rect x="10" y="40" width="7" height="26" rx="3" fill="#475569" />
      <rect x="83" y="40" width="7" height="26" rx="3" fill="#475569" />
      <rect x="10" y="134" width="7" height="26" rx="3" fill="#475569" />
      <rect x="83" y="134" width="7" height="26" rx="3" fill="#475569" />
    </svg>
  );
}

export default function VehicleDamageMap({ damages, editable = false, onChange }: VehicleDamageMapProps) {
  const [zones, setZones] = useState(DEFAULT_ZONES);
  const [kinds, setKinds] = useState(DEFAULT_KINDS);
  const [severities, setSeverities] = useState(DEFAULT_SEVERITIES);
  const [draftPoint, setDraftPoint] = useState<{ x: number; y: number; editingIndex: number | null } | null>(null);
  const [zone, setZone] = useState("");
  const [kind, setKind] = useState("");
  const [severity, setSeverity] = useState("leve");
  const [description, setDescription] = useState("");
  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);
  const [pendingPhotoPreview, setPendingPhotoPreview] = useState<string | null>(null);
  const [activePopover, setActivePopover] = useState<number | null>(null);

  useEffect(() => {
    if (!pendingPhoto) {
      setPendingPhotoPreview(null);
      return;
    }
    const url = URL.createObjectURL(pendingPhoto);
    setPendingPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingPhoto]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("bayline.damageOptions");
      if (!saved) return;
      const parsed = JSON.parse(saved) as { zones?: string[]; kinds?: string[]; severities?: string[] };
      if (parsed.zones) setZones(Array.from(new Set([...DEFAULT_ZONES, ...parsed.zones])).sort());
      if (parsed.kinds) setKinds(Array.from(new Set([...DEFAULT_KINDS, ...parsed.kinds])).sort());
      if (parsed.severities) setSeverities(Array.from(new Set([...DEFAULT_SEVERITIES, ...parsed.severities])).sort());
    } catch {
      // Keep the built-in options if local preferences are unavailable.
    }
  }, []);

  function saveOptions(nextZones = zones, nextKinds = kinds, nextSeverities = severities) {
    localStorage.setItem(
      "bayline.damageOptions",
      JSON.stringify({ zones: nextZones, kinds: nextKinds, severities: nextSeverities })
    );
  }

  function addZone(value: string) {
    const next = Array.from(new Set([...zones, value.trim().toLowerCase().replace(/\s+/g, "_")])).sort();
    setZones(next);
    setZone(next.find((z) => z === value.trim().toLowerCase().replace(/\s+/g, "_")) ?? value);
    saveOptions(next, kinds, severities);
  }

  function addKind(value: string) {
    const next = Array.from(new Set([...kinds, value.trim().toLowerCase().replace(/\s+/g, "_")])).sort();
    setKinds(next);
    setKind(next.find((k) => k === value.trim().toLowerCase().replace(/\s+/g, "_")) ?? value);
    saveOptions(zones, next, severities);
  }

  function addSeverity(value: string) {
    const next = Array.from(new Set([...severities, value.trim().toLowerCase().replace(/\s+/g, "_")])).sort();
    setSeverities(next);
    setSeverity(next.find((s) => s === value.trim().toLowerCase().replace(/\s+/g, "_")) ?? value);
    saveOptions(zones, kinds, next);
  }

  function handleContainerClick(event: React.MouseEvent<HTMLDivElement>) {
    if (!editable) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    setZone("");
    setKind("");
    setSeverity("leve");
    setDescription("");
    setPendingPhoto(null);
    setDraftPoint({ x, y, editingIndex: null });
  }

  function openForEdit(index: number, event: React.MouseEvent) {
    event.stopPropagation();
    if (!editable) {
      setActivePopover((prev) => (prev === index ? null : index));
      return;
    }
    const existing = damages[index];
    setZone(existing.zone);
    setKind(existing.kind);
    setSeverity(existing.severity);
    setDescription(existing.description ?? "");
    setPendingPhoto(existing.pendingPhoto ?? null);
    setDraftPoint({ x: existing.x, y: existing.y, editingIndex: index });
  }

  function confirmDraft() {
    if (!draftPoint || !zone || !kind || !severity) return;
    const point: DamagePoint = {
      x: draftPoint.x, y: draftPoint.y, zone, kind, severity, description: description.trim() || null,
      pendingPhoto,
    };
    const next = [...damages];
    if (draftPoint.editingIndex !== null) {
      next[draftPoint.editingIndex] = { ...next[draftPoint.editingIndex], ...point };
    } else {
      next.push(point);
    }
    onChange?.(next);
    setDraftPoint(null);
  }

  function removeDraft() {
    if (draftPoint?.editingIndex !== null && draftPoint?.editingIndex !== undefined) {
      onChange?.(damages.filter((_, i) => i !== draftPoint.editingIndex));
    }
    setDraftPoint(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-widest text-steel">Mapa de daños</p>
        {editable && <p className="text-xs text-steel">{damages.length} marcado{damages.length === 1 ? "" : "s"}</p>}
      </div>

      <div className="mt-2 grid gap-4 sm:grid-cols-[180px_1fr]">
        <div
          onClick={handleContainerClick}
          className={`relative mx-auto aspect-[1/2] w-full max-w-[180px] rounded-xl border border-navy/10 bg-white ${
            editable ? "cursor-crosshair" : ""
          }`}
        >
          <CarOutline />
          {damages.map((damage, index) => (
            <button
              key={damage.id ?? index}
              type="button"
              onClick={(event) => openForEdit(index, event)}
              title={`${labelize(damage.zone)} · ${labelize(damage.kind)} (${labelize(damage.severity)})`}
              style={{ left: `${damage.x * 100}%`, top: `${damage.y * 100}%` }}
              className={`absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow ${dotStyle(damage.severity)}`}
            />
          ))}
        </div>

        <div className="space-y-2">
          {damages.length === 0 && (
            <p className="text-sm text-steel">
              {editable ? "Toca el diagrama para marcar un daño." : "Sin daños registrados."}
            </p>
          )}
          {!editable &&
            damages.map((damage, index) => (
              <button
                key={damage.id ?? index}
                type="button"
                onClick={(event) => openForEdit(index, event)}
                className="flex w-full items-start gap-2 rounded-xl border border-navy/10 px-3 py-2 text-left text-sm transition hover:bg-ash"
              >
                {damage.photo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={damage.photo_url} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full border ${dotStyle(damage.severity)}`} />
                    <span className="font-medium text-navy">{labelize(damage.zone)}</span>
                    <span className="text-steel">· {labelize(damage.kind)} · {labelize(damage.severity)}</span>
                  </div>
                  {damage.description && <p className="mt-1 text-xs text-steel">{damage.description}</p>}
                </div>
              </button>
            ))}
          {editable &&
            damages.map((damage, index) => (
              <button
                key={damage.id ?? index}
                type="button"
                onClick={(event) => openForEdit(index, event)}
                className="flex w-full items-center gap-2 rounded-xl border border-navy/10 px-3 py-2 text-left text-sm transition hover:bg-ash"
              >
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full border ${dotStyle(damage.severity)}`} />
                <span className="font-medium text-navy">{labelize(damage.zone)}</span>
                <span className="text-steel">· {labelize(damage.kind)} · {labelize(damage.severity)}</span>
                {(damage.photo_url || damage.pendingPhoto) && <Camera className="ml-auto h-3.5 w-3.5 text-steel" />}
              </button>
            ))}
        </div>
      </div>

      {draftPoint && editable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setDraftPoint(null)}>
          <div onClick={(event) => event.stopPropagation()} className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-display text-sm font-bold text-navy">
                {draftPoint.editingIndex !== null ? "Editar daño" : "Nuevo daño"}
              </p>
              <button onClick={() => setDraftPoint(null)} aria-label="Cerrar" className="rounded-lg p-1.5 text-steel hover:bg-ash">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <CreatableSelect label="Zona" required canAdd value={zone} options={zones} onChange={setZone} onAdd={addZone} placeholder="Selecciona una zona..." />
              <CreatableSelect label="Tipo de daño" required canAdd value={kind} options={kinds} onChange={setKind} onAdd={addKind} placeholder="Selecciona un tipo..." />
              <CreatableSelect label="Severidad" required canAdd value={severity} options={severities} onChange={setSeverity} onAdd={addSeverity} />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy">Descripción (opcional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Ej. Unos 10 cm, junto a la manilla."
                  className="w-full rounded-xl border border-navy/15 px-3 py-2 text-sm outline-none focus:border-blue"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy">Foto (opcional)</label>
                {pendingPhotoPreview ? (
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={pendingPhotoPreview} alt="Vista previa" className="h-14 w-14 rounded-lg object-cover" />
                    <button
                      type="button"
                      onClick={() => setPendingPhoto(null)}
                      className="text-xs font-semibold text-red-500 hover:text-red-600"
                    >
                      Quitar foto
                    </button>
                  </div>
                ) : (
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => setPendingPhoto(e.target.files?.[0] ?? null)}
                    className="w-full text-sm text-steel file:mr-3 file:rounded-full file:border-0 file:bg-blue-light file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-blue"
                  />
                )}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={confirmDraft}
                  disabled={!zone || !kind || !severity}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  {draftPoint.editingIndex !== null ? "Guardar" : "Agregar"}
                </button>
                {draftPoint.editingIndex !== null && (
                  <button
                    type="button"
                    onClick={removeDraft}
                    aria-label="Eliminar daño"
                    className="rounded-full border border-red-200 p-2 text-red-500 transition hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activePopover !== null && !editable && damages[activePopover] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setActivePopover(null)}>
          <div onClick={(event) => event.stopPropagation()} className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-display text-sm font-bold text-navy">{labelize(damages[activePopover].zone)}</p>
              <button onClick={() => setActivePopover(null)} aria-label="Cerrar" className="rounded-lg p-1.5 text-steel hover:bg-ash">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-steel">
              {labelize(damages[activePopover].kind)} · {labelize(damages[activePopover].severity)}
            </p>
            {damages[activePopover].description && (
              <p className="mt-2 text-sm text-navy">{damages[activePopover].description}</p>
            )}
            {damages[activePopover].photo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={damages[activePopover].photo_url ?? undefined}
                alt="Foto del daño"
                className="mt-3 w-full rounded-xl object-cover"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
