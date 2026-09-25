"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Loader2, Search, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTemparios } from "@/hooks/useTemparios";
import { useParts } from "@/hooks/useParts";
import { useWarrantyPolicies } from "@/hooks/useWarrantyPolicies";
import { getWarrantyPolicy } from "@/lib/api/warrantyPolicies";
import type {
  WarrantyPolicyAppliesTo,
  WarrantyPolicyCoveredBy,
  WarrantyPolicyScope,
  WarrantyPolicyStatus,
} from "@/types/warrantyPolicy";

interface LinkedItem {
  id: string;
  label: string;
}

function TemparioPicker({ filialId, selected, onAdd, onRemove }: { filialId: string; selected: LinkedItem[]; onAdd: (item: LinkedItem) => void; onRemove: (id: string) => void }) {
  const [search, setSearch] = useState("");
  const { temparios } = useTemparios(filialId, search || undefined);
  const suggestions = search ? temparios.filter((t) => !selected.some((s) => s.id === t.id)).slice(0, 6) : [];

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-steel" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar tempario — código o nombre..."
          className="w-full rounded-lg border border-navy/15 py-2 pl-8 pr-4 text-sm outline-none focus:border-blue"
        />
        {suggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full divide-y divide-navy/5 rounded-lg border border-navy/10 bg-white shadow-lg">
            {suggestions.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  onAdd({ id: t.id, label: `${t.code} · ${t.name}` });
                  setSearch("");
                }}
                className="block w-full px-3 py-1.5 text-left text-sm hover:bg-ash"
              >
                <span className="font-mono text-blue">{t.code}</span> <span className="text-navy">{t.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selected.map((item) => (
            <span key={item.id} className="flex items-center gap-1.5 rounded-full bg-ash px-3 py-1 text-xs text-navy">
              {item.label}
              <button type="button" onClick={() => onRemove(item.id)} className="text-steel hover:text-red-500">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function PartPicker({ filialId, selected, onAdd, onRemove }: { filialId: string; selected: LinkedItem[]; onAdd: (item: LinkedItem) => void; onRemove: (id: string) => void }) {
  const [search, setSearch] = useState("");
  const { parts } = useParts(filialId, search || undefined);
  const suggestions = search ? parts.filter((p) => !selected.some((s) => s.id === p.id)).slice(0, 6) : [];

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-steel" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar repuesto — código o nombre..."
          className="w-full rounded-lg border border-navy/15 py-2 pl-8 pr-4 text-sm outline-none focus:border-blue"
        />
        {suggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full divide-y divide-navy/5 rounded-lg border border-navy/10 bg-white shadow-lg">
            {suggestions.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  onAdd({ id: p.id, label: `${p.code} · ${p.name}` });
                  setSearch("");
                }}
                className="block w-full px-3 py-1.5 text-left text-sm hover:bg-ash"
              >
                <span className="font-mono text-blue">{p.code}</span> <span className="text-navy">{p.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selected.map((item) => (
            <span key={item.id} className="flex items-center gap-1.5 rounded-full bg-ash px-3 py-1 text-xs text-navy">
              {item.label}
              <button type="button" onClick={() => onRemove(item.id)} className="text-steel hover:text-red-500">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

interface WarrantyPolicyFormViewProps {
  /** When set, edits that existing policy instead of creating a new one. */
  policyId?: string;
}

export default function WarrantyPolicyFormView({ policyId }: WarrantyPolicyFormViewProps) {
  const router = useRouter();
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;
  const { addPolicy, editPolicy } = useWarrantyPolicies(filialId);

  const [loading, setLoading] = useState(!!policyId);
  const [name, setName] = useState("");
  const [appliesTo, setAppliesTo] = useState<WarrantyPolicyAppliesTo>("mano_de_obra");
  const [coveredBy, setCoveredBy] = useState<WarrantyPolicyCoveredBy>("la_casa");
  const [scope, setScope] = useState<WarrantyPolicyScope>("pieza_mas_instalacion");
  const [noExpiration, setNoExpiration] = useState(false);
  const [durationDays, setDurationDays] = useState("");
  const [durationKm, setDurationKm] = useState("");
  const [policyStatus, setPolicyStatus] = useState<WarrantyPolicyStatus>("activa");
  const [temparios, setTemparios] = useState<LinkedItem[]>([]);
  const [parts, setParts] = useState<LinkedItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!policyId) return;
    (async () => {
      setLoading(true);
      const policy = await getWarrantyPolicy(policyId);
      setName(policy.name);
      setAppliesTo(policy.applies_to);
      setCoveredBy(policy.covered_by);
      setScope(policy.scope);
      setNoExpiration(policy.no_expiration);
      setDurationDays(policy.duration_days != null ? String(policy.duration_days) : "");
      setDurationKm(policy.duration_km != null ? String(policy.duration_km) : "");
      setPolicyStatus(policy.status);
      setTemparios(policy.temparios.map((t) => ({ id: t.tempario_id, label: `${t.tempario_code} · ${t.tempario_name}` })));
      setParts(policy.parts.map((p) => ({ id: p.part_id, label: `${p.part_code} · ${p.part_name}` })));
      setLoading(false);
    })();
  }, [policyId]);

  async function handleSubmit() {
    if (!filialId) return;
    if (!name.trim()) {
      setError("El nombre de la política es obligatorio.");
      return;
    }
    if (!noExpiration && !durationDays && !durationKm) {
      setError("Define días y/o kilómetros de vigencia, o marca la política como sin vencimiento.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        applies_to: appliesTo,
        covered_by: coveredBy,
        scope,
        no_expiration: noExpiration,
        duration_days: noExpiration ? null : durationDays ? Number(durationDays) : null,
        duration_km: noExpiration ? null : durationKm ? Number(durationKm) : null,
        status: policyStatus,
        tempario_ids: temparios.map((t) => t.id),
        part_ids: parts.map((p) => p.id),
      };
      if (policyId) {
        await editPolicy(policyId, {
          ...payload,
          clear_duration_days: noExpiration || !durationDays,
          clear_duration_km: noExpiration || !durationKm,
        });
        router.push(`/dashboard/post-ventas/politicas-garantia/${policyId}`);
      } else {
        const created = await addPolicy({ filial_id: filialId, ...payload });
        router.push(`/dashboard/post-ventas/politicas-garantia/${created.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la política.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!filialId || loading) {
    return <div className="p-12 text-center text-sm text-steel">Cargando...</div>;
  }

  return (
    <div>
      <Link
        href={policyId ? `/dashboard/post-ventas/politicas-garantia/${policyId}` : "/dashboard/post-ventas/politicas-garantia"}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-steel hover:text-navy"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver
      </Link>

      <h1 className="mb-6 font-display text-3xl font-bold text-navy">
        {policyId ? "Editar política de garantía" : "Nueva política de garantía"}
      </h1>

      <div className="max-w-2xl space-y-5">
        <div className="rounded-2xl border border-navy/10 bg-white p-6">
          <label className="mb-1.5 block text-sm font-medium text-navy">Nombre</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Estándar de taller"
            className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
          />
        </div>

        <div className="grid gap-4 rounded-2xl border border-navy/10 bg-white p-6 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Aplica a</label>
            <select
              value={appliesTo}
              onChange={(e) => setAppliesTo(e.target.value as WarrantyPolicyAppliesTo)}
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
            >
              <option value="mano_de_obra">Mano de obra</option>
              <option value="repuestos">Repuestos</option>
              <option value="ambas">Ambas</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Quién cubre</label>
            <select
              value={coveredBy}
              onChange={(e) => setCoveredBy(e.target.value as WarrantyPolicyCoveredBy)}
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
            >
              <option value="la_casa">La casa</option>
              <option value="fabrica_importador">Fábrica / Importador</option>
              <option value="proveedor">Proveedor</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Alcance</label>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as WarrantyPolicyScope)}
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
            >
              <option value="solo_pieza">Solo la pieza</option>
              <option value="pieza_mas_instalacion">Pieza + instalación</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Estado</label>
            <select
              value={policyStatus}
              onChange={(e) => setPolicyStatus(e.target.value as WarrantyPolicyStatus)}
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
            >
              <option value="activa">Activa</option>
              <option value="inactiva">Inactiva</option>
            </select>
          </div>
        </div>

        <div className="rounded-2xl border border-navy/10 bg-white p-6">
          <label className="mb-3 flex items-center gap-2 text-sm font-medium text-navy">
            <input type="checkbox" checked={noExpiration} onChange={(e) => setNoExpiration(e.target.checked)} />
            Sin vencimiento (campañas)
          </label>
          {!noExpiration && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs text-steel">Días</label>
                <input
                  type="number"
                  min="0"
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                  placeholder="—"
                  className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-steel">Kilómetros</label>
                <input
                  type="number"
                  min="0"
                  value={durationKm}
                  onChange={(e) => setDurationKm(e.target.value)}
                  placeholder="—"
                  className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
                />
              </div>
              <p className="col-span-2 text-xs text-steel">Vence lo que ocurra primero. Puedes definir solo uno de los dos.</p>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-navy/10 bg-white p-6">
          <p className="mb-2 font-display text-sm font-bold text-navy">Temparios cubiertos</p>
          <p className="mb-3 text-xs text-steel">Solo informativo — no restringe qué políticas puede elegir una ODS.</p>
          <TemparioPicker
            filialId={filialId}
            selected={temparios}
            onAdd={(item) => setTemparios((prev) => [...prev, item])}
            onRemove={(id) => setTemparios((prev) => prev.filter((t) => t.id !== id))}
          />
        </div>

        <div className="rounded-2xl border border-navy/10 bg-white p-6">
          <p className="mb-2 font-display text-sm font-bold text-navy">Repuestos cubiertos</p>
          <p className="mb-3 text-xs text-steel">Solo informativo — no restringe qué políticas puede elegir una ODS.</p>
          <PartPicker
            filialId={filialId}
            selected={parts}
            onAdd={(item) => setParts((prev) => [...prev, item])}
            onRemove={(id) => setParts((prev) => prev.filter((p) => p.id !== id))}
          />
        </div>

        {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="flex items-center justify-center gap-2 rounded-full bg-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-50"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Guardar política
        </button>
      </div>
    </div>
  );
}
