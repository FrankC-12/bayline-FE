"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, ChevronLeft, Loader2, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useParts } from "@/hooks/useParts";
import { usePartReturns } from "@/hooks/usePartReturns";
import { useWarehouses } from "@/hooks/useWarehouses";

const CONDITIONS = [
  { value: "nuevo", label: "Nuevo/sin usar" },
  { value: "usado", label: "Usado" },
  { value: "defectuoso", label: "Defectuoso" },
];

const WRITE_OFF_DESTINATION = "Baja (merma)";
// A part returned usado/defectuoso can't go back into stock that gets sold
// to the next customer — only nuevo can return to sellable inventory.
const CONDITIONS_REQUIRING_WRITE_OFF = new Set(["usado", "defectuoso"]);

const REASONS = [
  { value: "pedido_en_exceso", label: "Pedido en exceso" },
  { value: "defectuoso", label: "Defectuoso" },
  { value: "repuesto_incorrecto", label: "Repuesto incorrecto" },
  { value: "otro", label: "Otro" },
];

export default function NewPartReturnView() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;

  const { parts } = useParts(filialId);
  const { addReturn } = usePartReturns(filialId);
  const { warehouses, loading: warehousesLoading } = useWarehouses(filialId);
  const activeWarehouses = useMemo(() => warehouses.filter((warehouse) => warehouse.is_active), [warehouses]);

  const [search, setSearch] = useState("");
  const [partId, setPartId] = useState("");
  const [condition, setCondition] = useState("nuevo");
  const [destination, setDestination] = useState("");
  const [origin, setOrigin] = useState("");
  const [quantity, setQuantity] = useState("0");
  const [reason, setReason] = useState("pedido_en_exceso");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const photoPreviews = useMemo(() => photos.map((file) => URL.createObjectURL(file)), [photos]);
  useEffect(() => () => photoPreviews.forEach((url) => URL.revokeObjectURL(url)), [photoPreviews]);

  function addPhotos(files: FileList | null) {
    if (!files) return;
    setPhotos((prev) => [...prev, ...Array.from(files)]);
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  const results = useMemo(() => {
    if (!search || partId) return [];
    const t = search.toLowerCase();
    return parts.filter((p) => p.code.toLowerCase().includes(t) || p.name.toLowerCase().includes(t)).slice(0, 6);
  }, [search, parts, partId]);

  const requiresWriteOff = CONDITIONS_REQUIRING_WRITE_OFF.has(condition);

  useEffect(() => {
    if (activeWarehouses.length === 0) {
      setOrigin("");
      setDestination((current) => (requiresWriteOff ? current : ""));
      return;
    }
    setOrigin((current) => current || activeWarehouses[0].name);
    setDestination((current) => current || (requiresWriteOff ? WRITE_OFF_DESTINATION : activeWarehouses[0].name));
  }, [activeWarehouses, requiresWriteOff]);

  useEffect(() => {
    if (requiresWriteOff) setDestination(WRITE_OFF_DESTINATION);
  }, [requiresWriteOff]);

  async function handleSubmit() {
    if (!filialId || !partId || !origin || !destination || Number(quantity) <= 0) {
      setError("Selecciona un repuesto, los almacenes y una cantidad mayor a 0.");
      return;
    }
    if (photos.length === 0) {
      setError("Agrega al menos una foto de evidencia del estado de la pieza.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await addReturn({
        filial_id: filialId,
        part_id: partId,
        condition,
        origin_warehouse: origin,
        destination_warehouse: destination,
        quantity: Number(quantity),
        reason,
        reason_notes: notes || null,
        photos,
      });
      router.push("/dashboard/repuestos/devoluciones");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar la devolución.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <Link
        href="/dashboard/repuestos/devoluciones"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-steel hover:text-navy"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver a Historial de Devoluciones
      </Link>

      <h1 className="mb-6 font-display text-3xl font-bold text-navy">Nueva Devolución de Repuestos</h1>

      <div className="max-w-2xl space-y-4">
        <div className="rounded-2xl border border-navy/10 bg-white p-6">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-steel">Repuesto</p>
          <div className="relative">
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPartId("");
              }}
              placeholder="Buscar por código o nombre..."
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
            />
            {results.length > 0 && (
              <div className="absolute z-10 mt-1 w-full divide-y divide-navy/5 rounded-xl border border-navy/10 bg-white shadow-lg">
                {results.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setPartId(p.id);
                      setSearch(`${p.code} · ${p.name}`);
                    }}
                    className="block w-full px-4 py-2 text-left text-sm hover:bg-ash"
                  >
                    <p className="font-medium text-navy">{p.name}</p>
                    <p className="text-xs text-steel">{p.code}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-navy/10 bg-white p-6">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-steel">Movimiento</p>
          <p className="rounded-xl border border-navy/15 bg-ash px-4 py-2.5 text-sm text-navy">Devolución</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Condición del repuesto</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
            >
              {CONDITIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Almacén destino</label>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              disabled={requiresWriteOff}
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20 disabled:bg-ash disabled:text-steel"
            >
              <option value="" disabled>
                {warehousesLoading ? "Cargando almacenes..." : "Selecciona un almacén"}
              </option>
              {!requiresWriteOff &&
                activeWarehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.name}>
                    {warehouse.name}
                  </option>
                ))}
              <option value={WRITE_OFF_DESTINATION}>{WRITE_OFF_DESTINATION}</option>
            </select>
            {requiresWriteOff && (
              <p className="mt-1.5 text-xs text-amber-700">
                Un repuesto {condition} solo puede enviarse a Baja (merma) — no vuelve a inventario vendible.
              </p>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Almacén origen</label>
            <select
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
            >
              <option value="" disabled>
                {warehousesLoading ? "Cargando almacenes..." : "Selecciona un almacén"}
              </option>
              {activeWarehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.name}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Cantidad</label>
            <input
              type="number"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-navy">Motivo de devolución</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
            >
              {REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!warehousesLoading && activeWarehouses.length === 0 && (
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
            No existen almacenes activos en esta filial. Debes crear uno antes de registrar una
            devolución.
          </p>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy">Especifica el motivo</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Describe el motivo de la devolución..."
            className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
          />
        </div>

        <div className="rounded-2xl border border-navy/10 bg-white p-6">
          <p className="mb-1 font-mono text-[11px] uppercase tracking-widest text-steel">
            Fotos de evidencia *
          </p>
          <p className="mb-3 text-xs text-steel">
            Obligatorio — es lo único que arbitra una disputa entre almacén, técnico y cliente sobre
            el estado en que volvió la pieza.
          </p>
          <div className="flex flex-wrap gap-3">
            {photos.map((file, i) => (
              <div key={i} className="group relative h-20 w-20 overflow-hidden rounded-xl border border-navy/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoPreviews[i]} alt={file.name} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  aria-label="Quitar foto"
                  className="absolute right-1 top-1 rounded-full bg-navy/70 p-1 text-white transition hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-navy/20 text-steel transition hover:border-blue/40 hover:text-blue">
              <Camera className="h-5 w-5" />
              <span className="text-[10px] font-medium">Agregar</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  addPhotos(e.target.files);
                  e.target.value = "";
                }}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting || warehousesLoading || activeWarehouses.length === 0}
          className="flex items-center justify-center gap-2 rounded-full bg-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-50"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Registrar devolución
        </button>
      </div>
    </div>
  );
}
