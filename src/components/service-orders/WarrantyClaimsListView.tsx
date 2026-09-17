"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Loader2, ShieldCheck, ShieldX } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import { authorizeWarrantyClaim, convertWarrantyClaimToOrder, listWarrantyClaims } from "@/lib/api/warrantyClaims";
import WarrantyClaimForm from "./WarrantyClaimForm";
import EmptyState from "@/components/common/EmptyState";
import type { ReworkFailureCategory, WarrantyClaim, WarrantyClaimStatus } from "@/types/warrantyClaim";

const CLAIM_TYPE_LABELS: Record<WarrantyClaim["claim_type"], string> = {
  fabrica: "Fábrica / importador",
  comeback: "Trabajo previo (comeback)",
  repuesto_proveedor: "Repuesto — proveedor",
  campana_recall: "Campaña o recall",
};

const STATUS_LABELS: Record<WarrantyClaimStatus, string> = {
  solicitado: "Solicitado",
  autorizado: "Autorizado",
  rechazado: "Rechazado",
  convertido_a_ods: "Convertido a ODS",
};

const STATUS_STYLES: Record<WarrantyClaimStatus, string> = {
  solicitado: "bg-amber-100 text-amber-700",
  autorizado: "bg-blue-light text-blue",
  rechazado: "bg-red-100 text-red-700",
  convertido_a_ods: "bg-emerald-100 text-emerald-700",
};

const FAILURE_CATEGORY_LABELS: Record<ReworkFailureCategory, string> = {
  mano_de_obra: "Mano de obra",
  repuesto_defectuoso: "Repuesto defectuoso",
  error_diagnostico: "Error de diagnóstico",
  mal_uso_cliente: "Mal uso del cliente",
  no_determinada: "No se pudo determinar",
};

export default function WarrantyClaimsListView() {
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;
  const { canEdit: canAuthorize } = useModuleAccess("administracion");

  const [claims, setClaims] = useState<WarrantyClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [authDecision, setAuthDecision] = useState<"aprobado" | "rechazado" | null>(null);
  const [authWarrantyOverride, setAuthWarrantyOverride] = useState(false);
  const [authWarrantyOverrideNote, setAuthWarrantyOverrideNote] = useState("");
  const [authFailureCategory, setAuthFailureCategory] = useState<ReworkFailureCategory | "">("");
  const [working, setWorking] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  function load() {
    if (!filialId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    listWarrantyClaims(filialId)
      .then(setClaims)
      .finally(() => setLoading(false));
  }

  useEffect(load, [filialId]);

  function toggleExpand(claim: WarrantyClaim) {
    setExpandedId((prev) => (prev === claim.id ? null : claim.id));
    setAuthDecision(null);
    setAuthWarrantyOverride(false);
    setAuthWarrantyOverrideNote("");
    setAuthFailureCategory(claim.failure_category ?? "");
    setActionError(null);
  }

  async function handleAuthorize(claim: WarrantyClaim) {
    if (!authDecision) return;
    setWorking(true);
    setActionError(null);
    try {
      const updated = await authorizeWarrantyClaim(claim.id, {
        decision: authDecision,
        warranty_override: authDecision === "aprobado" ? authWarrantyOverride : undefined,
        warranty_override_note:
          authDecision === "aprobado" && authWarrantyOverride ? authWarrantyOverrideNote.trim() : undefined,
        failure_category: authFailureCategory || undefined,
      });
      setClaims((prev) => prev.map((c) => (c.id === claim.id ? updated : c)));
      setAuthDecision(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "No se pudo registrar la decisión.");
    } finally {
      setWorking(false);
    }
  }

  async function handleConvert(claim: WarrantyClaim) {
    setWorking(true);
    setActionError(null);
    try {
      const updated = await convertWarrantyClaimToOrder(claim.id, {});
      setClaims((prev) => prev.map((c) => (c.id === claim.id ? updated : c)));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "No se pudo convertir el reclamo en orden.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <div>
      <h1 className="mb-2 font-display text-3xl font-bold text-navy">Garantías</h1>
      <p className="mb-6 text-sm text-steel">
        Un solo flujo para fábrica, comeback de taller, repuesto defectuoso y campañas — el tipo determina quién
        paga. Solicitado → autorizado/rechazado → convertido a ODS.
      </p>

      {filialId && <WarrantyClaimForm filialId={filialId} onCreated={load} />}

      <div className="mt-8 rounded-2xl border border-navy/10 bg-white p-6">
        <p className="font-display text-lg font-bold text-navy">Reclamos registrados</p>

        <div className="mt-4">
          {loading ? (
            <p className="text-sm text-steel">Cargando reclamos...</p>
          ) : claims.length === 0 ? (
            <EmptyState compact title="No hay reclamos de garantía registrados." />
          ) : (
            <div className="space-y-3">
              {claims.map((c) => (
                <div key={c.id} className="rounded-xl border border-navy/10 p-4 text-sm">
                  <button type="button" onClick={() => toggleExpand(c)} className="flex w-full items-start justify-between gap-3 text-left">
                    <div>
                      <p className="font-semibold text-navy">
                        {c.code} · {c.vehicle_plate} · {c.client_name}
                      </p>
                      <p className="mt-1 text-steel">{CLAIM_TYPE_LABELS[c.claim_type]}</p>
                      <p className="mt-1 text-xs text-steel">{c.failure_cause ?? c.reported_symptom}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest ${STATUS_STYLES[c.status]}`}>
                      {STATUS_LABELS[c.status]}
                    </span>
                  </button>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-steel">
                    <span>{new Date(c.claimed_at).toLocaleDateString("es-VE")}</span>
                    <span>·</span>
                    <span>{c.reported_mileage.toLocaleString("es-VE")} km reportados</span>
                    {c.mileage_inconsistent && (
                      <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 font-semibold text-red-700">
                        <AlertTriangle className="h-3 w-3" />
                        Kilometraje inconsistente
                      </span>
                    )}
                    {c.service_order_code && <span>· ODS: {c.service_order_code}</span>}
                  </div>

                  {c.auto_generated_supplier_claim_ids.length > 0 && (
                    <p className="mt-1.5 text-xs font-medium text-emerald-700">Se generó el reclamo al proveedor automáticamente.</p>
                  )}
                  {c.supplier_claim_note && <p className="mt-1.5 text-xs text-amber-700">{c.supplier_claim_note}</p>}
                  {c.resulting_service_order_id && (
                    <Link
                      href={`/dashboard/servicios/${c.resulting_service_order_id}`}
                      className="mt-1.5 inline-block text-xs font-semibold text-blue underline underline-offset-2 hover:text-navy"
                    >
                      Ver orden {c.resulting_service_order_code ?? "generada"}
                    </Link>
                  )}

                  {expandedId === c.id && (
                    <div className="mt-3 space-y-3 rounded-lg bg-ash p-3">
                      {actionError && <p className="text-xs text-red-600">{actionError}</p>}

                      {c.status === "solicitado" &&
                        (canAuthorize ? (
                          authDecision ? (
                            <div className="space-y-2">
                              {(c.claim_type === "comeback" || c.claim_type === "repuesto_proveedor") &&
                                authDecision === "aprobado" && (
                                  <select
                                    value={authFailureCategory}
                                    onChange={(e) => setAuthFailureCategory(e.target.value as ReworkFailureCategory)}
                                    className="w-full rounded-lg border border-navy/15 px-3 py-2 text-xs outline-none focus:border-blue"
                                  >
                                    <option value="">Selecciona la causa (obligatoria para aprobar)...</option>
                                    {(Object.entries(FAILURE_CATEGORY_LABELS) as [ReworkFailureCategory, string][]).map(([value, label]) => (
                                      <option key={value} value={value}>
                                        {label}
                                      </option>
                                    ))}
                                  </select>
                                )}
                              {(c.claim_type === "fabrica" || c.claim_type === "campana_recall") && authDecision === "aprobado" && (
                                <div className="space-y-1.5">
                                  <label className="flex items-center gap-2 text-xs text-navy">
                                    <input type="checkbox" checked={authWarrantyOverride} onChange={(e) => setAuthWarrantyOverride(e.target.checked)} />
                                    Autorizar por excepción aunque no haya garantía vigente
                                  </label>
                                  {authWarrantyOverride && (
                                    <textarea
                                      value={authWarrantyOverrideNote}
                                      onChange={(e) => setAuthWarrantyOverrideNote(e.target.value)}
                                      rows={2}
                                      placeholder="Motivo de la excepción (obligatorio)"
                                      className="w-full rounded-lg border border-navy/15 px-3 py-2 text-xs outline-none focus:border-blue"
                                    />
                                  )}
                                </div>
                              )}
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleAuthorize(c)}
                                  disabled={working}
                                  className="flex items-center gap-1.5 rounded-full bg-blue px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                                >
                                  {working && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                  Confirmar
                                </button>
                                <button onClick={() => setAuthDecision(null)} disabled={working} className="rounded-full border border-navy/15 px-3 py-1.5 text-xs font-semibold text-navy">
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                onClick={() => setAuthDecision("aprobado")}
                                className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:border-emerald-400"
                              >
                                <ShieldCheck className="h-3.5 w-3.5" />
                                Autorizar
                              </button>
                              <button
                                onClick={() => setAuthDecision("rechazado")}
                                className="flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:border-red-400"
                              >
                                <ShieldX className="h-3.5 w-3.5" />
                                Rechazar
                              </button>
                            </div>
                          )
                        ) : (
                          <p className="text-[11px] italic text-steel">Requiere autorización de un jefe de taller o gerente.</p>
                        ))}

                      {c.status === "autorizado" &&
                        (canAuthorize ? (
                          <button
                            onClick={() => handleConvert(c)}
                            disabled={working}
                            className="flex items-center gap-1.5 rounded-full bg-blue px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                          >
                            {working && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            Convertir a ODS
                          </button>
                        ) : (
                          <p className="text-[11px] italic text-steel">Requiere permiso de un jefe de taller o gerente para convertirlo en orden.</p>
                        ))}

                      {(c.status === "rechazado" || c.status === "convertido_a_ods") && (
                        <p className="text-[11px] italic text-steel">Este reclamo ya no admite más acciones.</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
