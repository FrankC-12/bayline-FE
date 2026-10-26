"use client";

import { useEffect, useState } from "react";
import { Camera, Plus, Trash2, X } from "lucide-react";
import Modal from "@/components/common/Modal";
import { evidenceUrl } from "@/lib/evidence";
import EvidenceGallery from "./EvidenceGallery";
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
  "capo",
  "techo",
  "maletero",
  "parachoques_delantero",
  "parachoques_trasero",
  "parabrisas",
  "luneta_trasera",
  "puerta_delantera_izquierda",
  "puerta_delantera_derecha",
  "puerta_trasera_izquierda",
  "puerta_trasera_derecha",
  "guardafango_delantero_izquierdo",
  "guardafango_delantero_derecho",
  "guardafango_trasero_izquierdo",
  "guardafango_trasero_derecho",
  "espejo_izquierdo",
  "espejo_derecho",
];
const DEFAULT_KINDS = [
  "rayon",
  "abolladura",
  "golpe",
  "oxido",
  "rotura",
  "faltante",
  "grieta",
  "desgaste",
];
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

/** Use the mobile diagram’s full canvas for the shared normalized damage coordinates. */
function CarOutline() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/images/damage_map.svg"
      width={326}
      height={448}
      draggable={false}
      alt="Vista superior del vehículo; frente arriba y parte trasera abajo"
      className="pointer-events-none h-full w-full select-none"
    />
  );
}

export default function VehicleDamageMap({
  damages,
  editable = false,
  onChange,
}: VehicleDamageMapProps) {
  const [zones, setZones] = useState(DEFAULT_ZONES);
  const [kinds, setKinds] = useState(DEFAULT_KINDS);
  const [severities, setSeverities] = useState(DEFAULT_SEVERITIES);
  const [draftPoint, setDraftPoint] = useState<{
    x: number;
    y: number;
    editingIndex: number | null;
  } | null>(null);
  const [zone, setZone] = useState("");
  const [kind, setKind] = useState("");
  const [severity, setSeverity] = useState("leve");
  const [description, setDescription] = useState("");
  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);
  const [pendingPhotoPreview, setPendingPhotoPreview] = useState<string | null>(
    null,
  );
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
      const parsed = JSON.parse(saved) as {
        zones?: string[];
        kinds?: string[];
        severities?: string[];
      };
      if (parsed.zones)
        setZones(
          Array.from(new Set([...DEFAULT_ZONES, ...parsed.zones])).sort(),
        );
      if (parsed.kinds)
        setKinds(
          Array.from(new Set([...DEFAULT_KINDS, ...parsed.kinds])).sort(),
        );
      if (parsed.severities)
        setSeverities(
          Array.from(
            new Set([...DEFAULT_SEVERITIES, ...parsed.severities]),
          ).sort(),
        );
    } catch {
      // Keep the built-in options if local preferences are unavailable.
    }
  }, []);

  function saveOptions(
    nextZones = zones,
    nextKinds = kinds,
    nextSeverities = severities,
  ) {
    localStorage.setItem(
      "bayline.damageOptions",
      JSON.stringify({
        zones: nextZones,
        kinds: nextKinds,
        severities: nextSeverities,
      }),
    );
  }

  function addZone(value: string) {
    const next = Array.from(
      new Set([...zones, value.trim().toLowerCase().replace(/\s+/g, "_")]),
    ).sort();
    setZones(next);
    setZone(
      next.find((z) => z === value.trim().toLowerCase().replace(/\s+/g, "_")) ??
        value,
    );
    saveOptions(next, kinds, severities);
  }

  function addKind(value: string) {
    const next = Array.from(
      new Set([...kinds, value.trim().toLowerCase().replace(/\s+/g, "_")]),
    ).sort();
    setKinds(next);
    setKind(
      next.find((k) => k === value.trim().toLowerCase().replace(/\s+/g, "_")) ??
        value,
    );
    saveOptions(zones, next, severities);
  }

  function addSeverity(value: string) {
    const next = Array.from(
      new Set([...severities, value.trim().toLowerCase().replace(/\s+/g, "_")]),
    ).sort();
    setSeverities(next);
    setSeverity(
      next.find((s) => s === value.trim().toLowerCase().replace(/\s+/g, "_")) ??
        value,
    );
    saveOptions(zones, kinds, next);
  }

  function handleContainerClick(event: React.MouseEvent<HTMLDivElement>) {
    if (!editable) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.min(
      1,
      Math.max(0, (event.clientX - rect.left) / rect.width),
    );
    const y = Math.min(
      1,
      Math.max(0, (event.clientY - rect.top) / rect.height),
    );
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
      x: draftPoint.x,
      y: draftPoint.y,
      zone,
      kind,
      severity,
      description: description.trim() || null,
      pendingPhoto,
    };
    const next = [...damages];
    if (draftPoint.editingIndex !== null) {
      next[draftPoint.editingIndex] = {
        ...next[draftPoint.editingIndex],
        ...point,
      };
    } else {
      next.push(point);
    }
    onChange?.(next);
    setDraftPoint(null);
  }

  function removeDraft() {
    if (
      draftPoint?.editingIndex !== null &&
      draftPoint?.editingIndex !== undefined
    ) {
      onChange?.(damages.filter((_, i) => i !== draftPoint.editingIndex));
    }
    setDraftPoint(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-widest text-steel">
          Mapa de daños
        </p>
        {editable && (
          <p className="text-xs text-steel">
            {damages.length} marcado{damages.length === 1 ? "" : "s"}
          </p>
        )}
      </div>

      <div className="mt-2 grid gap-4 sm:grid-cols-[280px_minmax(0,1fr)]">
        <figure className="min-w-0">
          <figcaption className="mb-2 text-center font-mono text-[10px] uppercase tracking-widest text-steel">
            ↑ Frente del vehículo
          </figcaption>
          <div
            onClick={handleContainerClick}
            className={`relative mx-auto aspect-[326/448] w-full max-w-[280px] overflow-visible rounded-2xl border border-navy/10 bg-slate-50 ${
              editable ? "cursor-crosshair" : ""
            }`}
          >
            <CarOutline />
            {damages.map((damage, index) => (
              <button
                key={damage.id ?? index}
                type="button"
                onClick={(event) => openForEdit(index, event)}
                title={`${index + 1}. ${labelize(damage.zone)} · ${labelize(damage.kind)} (${labelize(damage.severity)})`}
                aria-label={`Daño ${index + 1}: ${labelize(damage.zone)}, ${labelize(damage.kind)}, ${labelize(damage.severity)}`}
                aria-pressed={!editable && activePopover === index}
                style={{
                  left: `${damage.x * 100}%`,
                  top: `${damage.y * 100}%`,
                }}
                className={`absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 text-xs font-bold text-navy shadow-sm ring-2 ring-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue ${dotStyle(damage.severity)}`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-widest text-steel">
            Parte trasera
          </p>
          <div
            className="mt-3 flex flex-wrap justify-center gap-3 text-[11px] text-steel"
            aria-label="Severidad de daños"
          >
            {["leve", "moderado", "grave"].map((value) => (
              <span key={value} className="inline-flex items-center gap-1">
                <span
                  className={`h-2.5 w-2.5 rounded-full border ${dotStyle(value)}`}
                />
                {labelize(value)}
              </span>
            ))}
          </div>
        </figure>
        <div className="min-w-0 space-y-2">
          {damages.length === 0 && (
            <p className="text-sm text-steel">
              {editable
                ? "Toca el diagrama para marcar un daño."
                : "Sin daños registrados."}
            </p>
          )}
          {!editable &&
            damages.map((damage, index) => (
              <button
                key={damage.id ?? index}
                type="button"
                onClick={(event) => openForEdit(index, event)}
                className={`flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left text-sm transition ${activePopover === index ? "border-blue bg-blue-light" : "border-navy/10 hover:bg-ash"}`}
              >
                {evidenceUrl(damage.photo_url ?? "") && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={evidenceUrl(damage.photo_url ?? "") ?? undefined}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded-lg object-cover"
                  />
                )}
                <div className="min-w-0">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-steel">
                    Daño {index + 1}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full border ${dotStyle(damage.severity)}`}
                    />
                    <span className="font-medium text-navy">
                      {labelize(damage.zone)}
                    </span>
                    <span className="text-steel">
                      · {labelize(damage.kind)} · {labelize(damage.severity)}
                    </span>
                  </div>
                  {damage.description && (
                    <p className="mt-1 text-xs text-steel">
                      {damage.description}
                    </p>
                  )}
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
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full border ${dotStyle(damage.severity)}`}
                />
                <span className="font-medium text-navy">
                  {labelize(damage.zone)}
                </span>
                <span className="text-steel">
                  · {labelize(damage.kind)} · {labelize(damage.severity)}
                </span>
                {(damage.photo_url || damage.pendingPhoto) && (
                  <Camera className="ml-auto h-3.5 w-3.5 text-steel" />
                )}
              </button>
            ))}
        </div>
      </div>

      {draftPoint && editable && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4"
          onClick={() => setDraftPoint(null)}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="font-display text-sm font-bold text-navy">
                {draftPoint.editingIndex !== null
                  ? "Editar daño"
                  : "Nuevo daño"}
              </p>
              <button
                onClick={() => setDraftPoint(null)}
                aria-label="Cerrar"
                className="rounded-lg p-1.5 text-steel hover:bg-ash"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <CreatableSelect
                label="Zona"
                required
                canAdd
                value={zone}
                options={zones}
                onChange={setZone}
                onAdd={addZone}
                placeholder="Selecciona una zona..."
              />
              <CreatableSelect
                label="Tipo de daño"
                required
                canAdd
                value={kind}
                options={kinds}
                onChange={setKind}
                onAdd={addKind}
                placeholder="Selecciona un tipo..."
              />
              <CreatableSelect
                label="Severidad"
                required
                canAdd
                value={severity}
                options={severities}
                onChange={setSeverity}
                onAdd={addSeverity}
              />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy">
                  Descripción (opcional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Ej. Unos 10 cm, junto a la manilla."
                  className="w-full rounded-xl border border-navy/15 px-3 py-2 text-sm outline-none focus:border-blue"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy">
                  Foto (opcional)
                </label>
                {pendingPhotoPreview ? (
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={pendingPhotoPreview}
                      alt="Vista previa"
                      className="h-14 w-14 rounded-lg object-cover"
                    />
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
                    onChange={(e) =>
                      setPendingPhoto(e.target.files?.[0] ?? null)
                    }
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
        <Modal
          open
          title={`Daño ${activePopover + 1} · ${labelize(damages[activePopover].zone)}`}
          size="md"
          onClose={() => setActivePopover(null)}
        >
          <div className="space-y-3 p-5">
            <p className="text-sm text-steel">
              {labelize(damages[activePopover].kind)} ·{" "}
              {labelize(damages[activePopover].severity)}
            </p>
            {damages[activePopover].description && (
              <p className="whitespace-pre-wrap text-sm text-navy">
                {damages[activePopover].description}
              </p>
            )}
            <EvidenceGallery
              files={
                damages[activePopover].photo_url
                  ? [{ url: damages[activePopover].photo_url! }]
                  : []
              }
              title="Foto del daño"
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
