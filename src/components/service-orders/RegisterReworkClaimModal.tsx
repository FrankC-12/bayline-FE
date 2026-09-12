"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Loader2, AlertTriangle, CheckCircle2, Lock, ShieldCheck, ShieldX } from "lucide-react";
import {
  createReworkClaim,
  closeReworkClaim,
  authorizeReworkClaim,
  listReworkClaims,
} from "@/lib/api/reworkClaims";
import { useParts } from "@/hooks/useParts";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import type { ReworkClaim, ReworkFailureCategory } from "@/types/reworkClaim";
import type { OrderSummary } from "@/types/serviceOrder";

const FAILURE_CATEGORY_LABELS: Record<ReworkFailureCategory, string> = {
  mano_de_obra: "Mano de obra",
  repuesto_defectuoso: "Repuesto defectuoso",
  error_diagnostico: "Error de diagnóstico",
  mal_uso_cliente: "Mal uso del cliente",
  no_determinada: "No se pudo determinar",
};

const AUTH_STATUS_LABELS: Record<ReworkClaim["authorization_status"], string> = {
  pendiente: "Pendiente de autorización",
  aprobado: "Autorizado",
  rechazado: "Rechazado",
};

interface RegisterReworkClaimModalProps {
  orderId: string;
  orderCode: string;
  filialId: string | null;
  summary: OrderSummary | null;
  onClose: () => void;
}

export default function RegisterReworkClaimModal({
  orderId,
  orderCode,
  filialId,
  summary,
  onClose,
}: RegisterReworkClaimModalProps) {
  const { parts } = useParts(filialId);
  const { canEdit: canAuthorize } = useModuleAccess("administracion");
  const [claims, setClaims] = useState<ReworkClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [temparioId, setTemparioId] = useState("");
  const [partId, setPartId] = useState("");
  const [failureCategory, setFailureCategory] = useState<ReworkFailureCategory | "">("");
  const [failureCause, setFailureCause] = useState("");
  const [claimedAt, setClaimedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [closingId, setClosingId] = useState<string | null>(null);
  const [closeCategory, setCloseCategory] = useState<ReworkFailureCategory | "">("");
  const [closing, setClosing] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);

  const [authorizingId, setAuthorizingId] = useState<string | null>(null);
  const [authDecision, setAuthDecision] = useState<"aprobado" | "rechazado" | null>(null);
  const [authWarrantyOverride, setAuthWarrantyOverride] = useState(false);
  const [authWarrantyOverrideNote, setAuthWarrantyOverrideNote] = useState("");
  const [authorizing, setAuthorizing] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const partIds = Array.from(new Set(summary?.transfers.flatMap((t) => t.lines.map((l) => l.part_id)) ?? []));

  useEffect(() => {
    let active = true;
    listReworkClaims(orderId)
      .then((data) => { if (active) setClaims(data); })
      .catch(() => { if (active) setError("No se pudieron cargar los reclamos existentes."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [orderId]);

  async function handleSubmit() {
    if (failureCause.trim().length < 3) {
      setError("Describe la causa de la falla (mínimo 3 caracteres).");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const created = await createReworkClaim(orderId, {
        tempario_id: temparioId || null,
        part_id: partId || null,
        failure_category: failureCategory || null,
        failure_cause: failureCause.trim(),
        claimed_at: claimedAt,
        note: note.trim() || null,
      });
      setClaims((prev) => [created, ...prev]);
      setTemparioId(""); setPartId(""); setFailureCategory(""); setFailureCause(""); setNote("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar el reclamo.");
    } finally {
      setSubmitting(false);
    }
  }

  function startClosing(c: ReworkClaim) {
    setClosingId(c.id);
    setCloseCategory(c.failure_category ?? "");
    setCloseError(null);
  }

  async function handleClose(claimId: string) {
    if (!closeCategory) {
      setCloseError("Elige la causa de la falla — no se puede cerrar sin registrarla.");
      return;
    }
    setClosing(true);
    setCloseError(null);
    try {
      const updated = await closeReworkClaim(orderId, claimId, { failure_category: closeCategory });
      setClaims((prev) => prev.map((c) => (c.id === claimId ? updated : c)));
      setClosingId(null);
    } catch (err) {
      setCloseError(err instanceof Error ? err.message : "No se pudo cerrar el reclamo.");
    } finally {
      setClosing(false);
    }
  }

  function startAuthorizing(claimId: string, decision: "aprobado" | "rechazado") {
    setAuthorizingId(claimId);
    setAuthDecision(decision);
    setAuthWarrantyOverride(false);
    setAuthWarrantyOverrideNote("");
    setAuthError(null);
  }

  async function handleAuthorize(claimId: string) {
    if (!authDecision) return;
    if (authDecision === "aprobado" && authWarrantyOverride && !authWarrantyOverrideNote.trim()) {
      setAuthError("Registra el motivo de la excepción de garantía.");
      return;
    }
    setAuthorizing(true);
    setAuthError(null);
    try {
      const updated = await authorizeReworkClaim(orderId, claimId, {
        decision: authDecision,
        warranty_override: authDecision === "aprobado" ? authWarrantyOverride : undefined,
        warranty_override_note:
          authDecision === "aprobado" && authWarrantyOverride ? authWarrantyOverrideNote.trim() : undefined,
      });
      setClaims((prev) => prev.map((c) => (c.id === claimId ? updated : c)));
      setAuthorizingId(null);
      setAuthDecision(null);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "No se pudo registrar la decisión.");
    } finally {
      setAuthorizing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-navy/40" />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-navy/10 px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-bold text-navy">Reclamos de garantía</h2>
            <p className="text-xs text-steel">{orderCode}</p>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="rounded-lg p-2 text-steel hover:bg-ash hover:text-navy">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div className="flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>Idealmente la causa la registra quien hizo el trabajo. Si no hay forma de que el técnico la registre él mismo, deja claro que quedó anotada por el asesor.</p>
          </div>

          {loading ? (
            <p className="text-sm text-steel">Cargando reclamos existentes...</p>
          ) : claims.length > 0 ? (
            <div className="space-y-2">
              {claims.map((c) => (
                <div key={c.id} className="rounded-xl border border-navy/10 p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-navy">{c.failure_cause}</span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-widest ${
                          c.status === "cerrado" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {c.status === "cerrado" ? "Cerrado" : "Abierto"}
                      </span>
                      <span className="text-xs text-steel">{new Date(c.claimed_at).toLocaleDateString("es-VE")}</span>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-steel">
                    {c.failure_category ? FAILURE_CATEGORY_LABELS[c.failure_category] : "Causa sin determinar todavía"}
                    {c.days_since_invoice != null && ` · ${c.days_since_invoice} días desde la factura`}
                    {c.tempario_name && ` · Servicio: ${c.tempario_name}`}
                    {c.part_name && ` · Repuesto: ${c.part_name}`}
                  </p>
                  {c.auto_generated_supplier_claim_ids.length > 0 && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Se generó el reclamo al proveedor automáticamente.
                    </p>
                  )}
                  {c.supplier_claim_note && (
                    <p className="mt-1.5 text-xs text-amber-700">{c.supplier_claim_note}</p>
                  )}

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-widest ${
                        c.authorization_status === "aprobado"
                          ? "bg-emerald-100 text-emerald-700"
                          : c.authorization_status === "rechazado"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {AUTH_STATUS_LABELS[c.authorization_status]}
                    </span>
                    {c.warranty_override && (
                      <span className="text-[11px] italic text-amber-700">Excepción de garantía registrada</span>
                    )}
                    {c.resulting_service_order_id && (
                      <Link
                        href={`/dashboard/servicios/${c.resulting_service_order_id}`}
                        className="text-[11px] font-semibold text-blue underline underline-offset-2 hover:text-navy"
                      >
                        Ver orden {c.resulting_service_order_code ?? "generada"}
                      </Link>
                    )}
                  </div>

                  {c.authorization_status === "pendiente" && (
                    authorizingId === c.id ? (
                      <div className="mt-3 space-y-2 rounded-lg bg-ash p-3">
                        <p className="text-xs font-medium text-navy">
                          {authDecision === "aprobado"
                            ? "Autorizar: se abrirá una orden de retrabajo gratuita para el cliente."
                            : "Rechazar: se abrirá una orden normal que el cliente paga."}
                        </p>
                        {authDecision === "aprobado" && (
                          <div className="space-y-1.5">
                            <label className="flex items-center gap-2 text-xs text-navy">
                              <input
                                type="checkbox"
                                checked={authWarrantyOverride}
                                onChange={(e) => setAuthWarrantyOverride(e.target.checked)}
                              />
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
                        {authError && <p className="text-xs text-red-600">{authError}</p>}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAuthorize(c.id)}
                            disabled={authorizing}
                            className="flex items-center gap-1.5 rounded-full bg-blue px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                          >
                            {authorizing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            Confirmar
                          </button>
                          <button
                            onClick={() => { setAuthorizingId(null); setAuthDecision(null); }}
                            disabled={authorizing}
                            className="rounded-full border border-navy/15 px-3 py-1.5 text-xs font-semibold text-navy"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : canAuthorize ? (
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => startAuthorizing(c.id, "aprobado")}
                          className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:border-emerald-400"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Aprobar
                        </button>
                        <button
                          onClick={() => startAuthorizing(c.id, "rechazado")}
                          className="flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:border-red-400"
                        >
                          <ShieldX className="h-3.5 w-3.5" />
                          Rechazar
                        </button>
                      </div>
                    ) : (
                      <p className="mt-2 text-[11px] italic text-steel">
                        Requiere autorización de un jefe de taller o gerente.
                      </p>
                    )
                  )}

                  {c.status === "abierto" && (
                    closingId === c.id ? (
                      <div className="mt-3 space-y-2 rounded-lg bg-ash p-3">
                        <label className="block text-xs font-medium text-navy">Causa de la falla (obligatoria para cerrar)</label>
                        <select
                          value={closeCategory}
                          onChange={(e) => setCloseCategory(e.target.value as ReworkFailureCategory)}
                          className="w-full rounded-lg border border-navy/15 px-3 py-2 text-sm outline-none focus:border-blue"
                        >
                          <option value="">Selecciona una causa...</option>
                          {(Object.entries(FAILURE_CATEGORY_LABELS) as [ReworkFailureCategory, string][]).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                        {closeError && <p className="text-xs text-red-600">{closeError}</p>}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleClose(c.id)}
                            disabled={closing}
                            className="flex items-center gap-1.5 rounded-full bg-blue px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                          >
                            {closing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            Confirmar cierre
                          </button>
                          <button
                            onClick={() => setClosingId(null)}
                            disabled={closing}
                            className="rounded-full border border-navy/15 px-3 py-1.5 text-xs font-semibold text-navy"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => startClosing(c)}
                        className="mt-2 flex items-center gap-1.5 rounded-full border border-navy/15 px-3 py-1.5 text-xs font-semibold text-navy transition hover:border-blue hover:text-blue"
                      >
                        <Lock className="h-3.5 w-3.5" />
                        Cerrar reclamo
                      </button>
                    )
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm italic text-steel">No hay reclamos registrados para esta orden.</p>
          )}

          <div className="space-y-3 border-t border-navy/10 pt-5">
            <p className="font-mono text-[11px] uppercase tracking-widest text-blue">Registrar nuevo reclamo</p>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">Servicio implicado (opcional)</label>
              <select value={temparioId} onChange={(e) => setTemparioId(e.target.value)} className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue">
                <option value="">Sin servicio específico</option>
                {summary?.tasks.map((t) => (
                  <option key={t.tempario_id} value={t.tempario_id}>{t.code_snapshot} · {t.name_snapshot}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">Repuesto implicado (opcional)</label>
              <select value={partId} onChange={(e) => setPartId(e.target.value)} className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue">
                <option value="">Sin repuesto específico</option>
                {partIds.map((id) => (
                  <option key={id} value={id}>{parts.find((p) => p.id === id)?.name ?? id}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">Causa de la falla (opcional por ahora)</label>
              <select
                value={failureCategory}
                onChange={(e) => setFailureCategory(e.target.value as ReworkFailureCategory)}
                className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
              >
                <option value="">Aún no se sabe</option>
                {(Object.entries(FAILURE_CATEGORY_LABELS) as [ReworkFailureCategory, string][]).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-steel">
                Si no se sabe todavía, se puede dejar sin elegir — pero hay que registrarla antes de cerrar el reclamo.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">Descripción de la falla</label>
              <textarea value={failureCause} onChange={(e) => setFailureCause(e.target.value)} rows={2} placeholder="Ej: fuga de aceite tras el cambio" className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue" />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">Fecha del reclamo</label>
              <input type="date" value={claimedAt} onChange={(e) => setClaimedAt(e.target.value)} className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue" />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">Nota (opcional)</label>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue" />
            </div>

            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Registrar reclamo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
