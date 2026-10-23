"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import WarrantyCoverage from "./WarrantyCoverage";
import EvidenceGallery from "@/components/inspections/EvidenceGallery";
import Modal from "@/components/common/Modal";
import { useAuth } from "@/contexts/AuthContext";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import { useUserDirectory } from "@/hooks/useUserDirectory";
import {
  getClaimsOverview,
  listWarrantyClaims,
  reviewClaim,
  type ClaimsOverview,
} from "@/lib/api/warrantyClaims";
import { formatEntryDate, formatEntryDateTime } from "@/lib/format";
import type {
  ReworkFailureCategory,
  WarrantyClaim,
} from "@/types/warrantyClaim";
import ClaimSupplierAction from "./ClaimSupplierAction";
import NewWarrantyClaim from "./NewWarrantyClaim";
const labels = {
  solicitado: "Esperando aprobación",
  autorizado: "Aprobado",
  rechazado: "Rechazado",
  convertido_a_ods: "Aprobado · ODS creada",
};
const types = {
  comeback: "Comeback",
  fabrica: "Garantía de fábrica",
  campana_recall: "Campaña o recall",
  repuesto_proveedor: "Repuesto · proveedor",
};
const money = (v: number) =>
  `$${v.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const failures: Record<ReworkFailureCategory, string> = {
  mano_de_obra: "Mano de obra",
  repuesto_defectuoso: "Repuesto defectuoso",
  error_diagnostico: "Error de diagnóstico",
  mal_uso_cliente: "Mal uso del cliente",
  no_determinada: "No determinada",
};
function coverageDescription(claim: WarrantyClaim) {
  const coverage = claim.coverage_snapshot;
  const terms = [
    coverage?.duration_days ? `${coverage.duration_days} días` : null,
    coverage?.duration_months ? `${coverage.duration_months} meses` : null,
    coverage?.duration_km
      ? `${coverage.duration_km.toLocaleString("es-VE")} km`
      : null,
  ]
    .filter(Boolean)
    .join(" o ");
  return `${coverage?.label ?? claim.tempario_name ?? types[claim.claim_type]}${terms ? ` · ${terms}` : ""}`;
}
export default function WarrantyClaimsListView() {
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;
  const { canEdit } = useModuleAccess("asesor-servicios"),
    { canEdit: canAuthorize } = useModuleAccess("administracion");
  const { users } = useUserDirectory({ filialId });
  const [claims, setClaims] = useState<WarrantyClaim[]>([]),
    [overview, setOverview] = useState<ClaimsOverview | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const [tab, setTab] = useState("all"),
    [search, setSearch] = useState(""),
    [creating, setCreating] = useState(false),
    [selected, setSelected] = useState<string | null>(null),
    [busy, setBusy] = useState(false),
    [reason, setReason] = useState(""),
    [failure, setFailure] = useState<ReworkFailureCategory>("no_determinada");
  const [confirmed, setConfirmed] = useState(false);
  const generation = useRef(0);
  const invalidate = useCallback(() => {
    generation.current += 1;
  }, []);
  const load = useCallback(async () => {
    const version = ++generation.current;
    if (!filialId) {
      setClaims([]);
      setOverview(null);
      setLoading(false);
      return;
    }
    try {
      const [rows, stats] = await Promise.all([
        listWarrantyClaims(filialId),
        getClaimsOverview(filialId),
      ]);
      if (version !== generation.current) return;
      setClaims(rows);
      setOverview(stats);
      setError("");
    } catch (e) {
      if (version !== generation.current) return;
      setError(
        e instanceof Error ? e.message : "No se pudieron cargar los reclamos.",
      );
    } finally {
      if (version === generation.current) setLoading(false);
    }
  }, [filialId]);
  useEffect(() => {
    void load();
    const interval = setInterval(() => void load(), 15000);
    return () => {
      clearInterval(interval);
      invalidate();
    };
  }, [load, invalidate]);
  const matches = (c: WarrantyClaim, key: string) =>
    key === "all" ||
    (key === "approved" &&
      (c.status === "convertido_a_ods" ||
        (c.status === "autorizado" && c.brand_status !== "en_marca"))) ||
    (key === "solicitado" &&
      (c.status === "solicitado" || c.brand_status === "en_marca")) ||
    c.status === key;
  const rows = claims.filter(
    (c) =>
      matches(c, tab) &&
      `${c.code} ${c.client_name} ${c.vehicle_plate} ${c.tempario_name} ${c.reported_symptom} ${c.failure_cause}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const claim = claims.find((c) => c.id === selected);
  const name = (id: string | null) =>
    users.find((u) => u.id === id)?.full_name ?? "Sin registrar";
  async function act(decision: "aprobado" | "rechazado") {
    if (!claim) return;
    setBusy(true);
    setError("");
    try {
      const updated = await reviewClaim(
        claim.id,
        {
          decision,
          rejection_reason: reason.trim() || undefined,
          failure_category: failure,
          failure_confirmed: confirmed,
        },
        false,
      );
      setClaims((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setReason("");
      await load();
      window.dispatchEvent(new Event("bayline:claims-updated"));
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo registrar la decisión.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-navy">
            Reclamos
          </h1>
          <p className="mt-2 text-sm text-steel">
            Garantías del taller, de fábrica y campañas. El trámite con la marca
            se hace por teléfono.
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => setCreating(true)}
            className="rounded-full bg-blue px-5 py-3 text-sm font-semibold text-white"
          >
            + Nuevo reclamo
          </button>
        )}
      </header>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-xs text-amber-800">Por aprobar</p>
          <p className="mt-2 text-2xl font-bold text-amber-800">
            {overview?.pending ?? "—"}
          </p>
        </div>
        <div className="rounded-2xl border border-navy/10 bg-white p-5">
          <p className="text-xs text-steel">Costo de comebacks · este mes</p>
          <p className="mt-2 text-2xl font-bold text-navy">
            {overview ? money(overview.monthly_cost) : "—"}
          </p>
          <p className="mt-1 text-xs text-steel">
            Repuestos despachados y mano de obra completada.
          </p>
        </div>
        <div className="rounded-2xl border border-navy/10 bg-white p-5">
          <p className="text-xs text-steel">Tasa de comebacks · este mes</p>
          <p className="mt-2 text-2xl font-bold text-navy">
            {overview?.monthly_closed
              ? `${overview.comeback_rate.toLocaleString("es-VE")} %`
              : "—"}
          </p>
          <p className="mt-1 text-xs text-steel">
            {overview?.monthly_reworks ?? 0} retrabajos de{" "}
            {overview?.monthly_closed ?? 0} ODS cerradas
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-wrap rounded-full bg-slate-100 p-1">
          {[
            ["all", "Todos"],
            ["solicitado", "Esperando aprobación"],
            ["approved", "Aprobados"],
            ["rechazado", "Rechazados"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-full px-3 py-2 text-xs ${key === tab ? "bg-white font-semibold shadow-sm" : "text-steel"}`}
            >
              {label} {claims.filter((c) => matches(c, key)).length}
            </button>
          ))}
        </div>
        <input
          aria-label="Buscar reclamos"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por cliente, placa o reclamo"
          className="min-w-0 flex-1 rounded-full border border-navy/10 px-4 py-2 text-sm"
        />
      </div>
      {error && !claim && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      <div className="overflow-x-auto rounded-2xl border border-navy/10 bg-white">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="border-b border-navy/10 font-mono text-[10px] uppercase tracking-wide text-steel">
            <tr>
              {[
                "Reclamo",
                "Vehículo · cliente",
                "Queja · sobre",
                "Tipo",
                "Estado",
              ].map((h) => (
                <th key={h} className="px-4 py-4">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr
                key={c.id}
                onClick={() => {
                  setConfirmed(false);
                  setSelected(c.id);
                  setReason("");
                  setError("");
                  setFailure(c.failure_category ?? "no_determinada");
                }}
                className="cursor-pointer border-b border-navy/5 last:border-0 hover:bg-slate-50"
              >
                <td className="px-4 py-5">
                  <button
                    onClick={() => {
                      setConfirmed(false);
                      setSelected(c.id);
                      setReason("");
                      setError("");
                      setFailure(c.failure_category ?? "no_determinada");
                    }}
                    className="font-mono text-xs font-semibold text-blue underline"
                  >
                    {c.code}
                  </button>
                  <p className="mt-2 text-xs text-steel">
                    {formatEntryDate(c.claimed_at)}
                  </p>
                </td>
                <td className="px-4 py-5">
                  <button
                    onClick={() => {
                      setConfirmed(false);
                      setSelected(c.id);
                      setReason("");
                      setError("");
                    }}
                    className="text-left"
                  >
                    <b>
                      {c.vehicle_label ?? "Vehículo"}{" "}
                      <span className="font-mono text-xs font-normal text-steel">
                        {c.vehicle_plate ?? c.vehicle_vin ?? "Sin placa"}
                      </span>
                    </b>
                    <p className="mt-1 text-xs text-steel">{c.client_name}</p>
                  </button>
                </td>
                <td className="max-w-xs px-4 py-5">
                  <p className="font-medium">
                    {c.reported_symptom ?? c.failure_cause}
                  </p>
                  <p className="mt-1 break-words text-xs text-steel">
                    {coverageDescription(c)}
                    {c.service_order_code ? ` · ${c.service_order_code}` : ""}
                  </p>
                </td>
                <td className="px-4 py-5 text-xs">{types[c.claim_type]}</td>
                <td className="px-4 py-5">
                  <span
                    className={`rounded-full px-2 py-1 text-[11px] font-semibold ${c.status === "solicitado" ? "bg-amber-100 text-amber-800" : c.status === "convertido_a_ods" ? "bg-emerald-100 text-emerald-800" : c.brand_status === "en_marca" ? "bg-blue-light text-blue" : "bg-slate-100 text-steel"}`}
                  >
                    {c.brand_status === "en_marca"
                      ? "Esperando aprobación"
                      : labels[c.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading ? (
          <p className="p-8 text-center text-sm text-steel">
            Cargando reclamos…
          </p>
        ) : (
          !rows.length && (
            <p className="p-8 text-center text-sm text-steel">
              No hay reclamos en esta bandeja.
            </p>
          )
        )}
      </div>
      {creating && filialId && (
        <NewWarrantyClaim
          filialId={filialId}
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            void load();
            window.dispatchEvent(new Event("bayline:claims-updated"));
          }}
        />
      )}
      <Modal
        open={!!claim}
        placement="right"
        onClose={() => {
          if (!busy) setSelected(null);
        }}
        closeDisabled={busy}
        title={claim ? `Reclamo ${claim.code}` : "Reclamo"}
        description={
          claim ? `${types[claim.claim_type]} · ${claim.client_name}` : ""
        }
        size="lg"
      >
        {claim && (
          <div className="space-y-5 p-6">
            <section className="rounded-xl bg-blue-light/30 p-4">
              <h3 className="font-semibold text-navy">
                Lo que reporta el cliente
              </h3>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm">
                {claim.reported_symptom ?? claim.failure_cause}
              </p>
              <p className="mt-3 text-xs text-steel">
                Sobre: {coverageDescription(claim)} · Entrega original:{" "}
                {claim.source_order_closed_at
                  ? formatEntryDateTime(claim.source_order_closed_at)
                  : "Sin fecha registrada"}{" "}
                · Técnico: {claim.source_technician_name ?? "Sin registrar"}
              </p>
            </section>
            <WarrantyCoverage
              assessment={claim.warranty_assessment}
              note="Verificado con el kilometraje y la fecha del reclamo. La relación de la falla con el trabajo la confirma el jefe de taller."
            />
            <div className="grid gap-4 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
              <p>
                <span className="block text-xs text-steel">Vehículo</span>
                {claim.vehicle_plate ?? "Sin placa"} ·{" "}
                {claim.vehicle_vin ?? "Sin VIN"}
              </p>
              <p>
                <span className="block text-xs text-steel">
                  Kilometraje reportado
                </span>
                {claim.reported_mileage.toLocaleString("es-VE")} km
              </p>
              <p>
                <span className="block text-xs text-steel">
                  Garantía reclamada
                </span>
                {coverageDescription(claim)}
              </p>
              <p>
                <span className="block text-xs text-steel">ODS de origen</span>
                {claim.service_order_id ? (
                  <Link
                    href={`/dashboard/servicios/${claim.service_order_id}`}
                    className="text-blue underline"
                  >
                    {claim.service_order_code ?? "Ver ODS"}
                  </Link>
                ) : (
                  "Sin ODS de origen"
                )}
              </p>
            </div>
            {claim.mileage_inconsistent && (
              <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                El kilometraje reportado es menor que el último registro del
                vehículo.
              </p>
            )}
            {claim.note && (
              <section>
                <h3 className="font-semibold text-navy">Nota del asesor</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm text-steel">
                  {claim.note}
                </p>
              </section>
            )}
            <section>
              <h3 className="font-semibold text-navy">Fotos y documentos</h3>
              <EvidenceGallery
                files={
                  claim.odometer_photo_url
                    ? [{ url: claim.odometer_photo_url }]
                    : []
                }
                title="Foto del tablero"
              />
              <EvidenceGallery
                files={[...claim.photo_urls, ...claim.document_urls].map(
                  (url) => ({ url }),
                )}
                title="Evidencias del reclamo"
              />
            </section>
            <section>
              <h3 className="font-semibold text-navy">Seguimiento</h3>
              <ol className="mt-3 space-y-3 border-l border-navy/10 pl-4 text-xs text-steel">
                <li>
                  Registrado por {name(claim.recorded_by_user_id)} ·{" "}
                  {formatEntryDateTime(claim.created_at)}
                </li>
                {claim.authorized_at && (
                  <li>
                    {claim.status === "rechazado" ? "Rechazado" : "Revisado"}{" "}
                    por {name(claim.authorized_by_user_id)} ·{" "}
                    {formatEntryDateTime(claim.authorized_at)}
                  </li>
                )}
                {claim.brand_sent_at && (
                  <li>
                    Enviado a la marca ·{" "}
                    {formatEntryDateTime(claim.brand_sent_at)}
                  </li>
                )}
                {claim.brand_response_at && (
                  <li>
                    Respuesta de la marca: {claim.brand_status} ·{" "}
                    {name(claim.brand_responded_by_user_id ?? null)} ·{" "}
                    {formatEntryDateTime(claim.brand_response_at)}
                  </li>
                )}
                {claim.converted_at && (
                  <li>
                    Borrador de ODS creado por{" "}
                    {name(claim.converted_by_user_id)} ·{" "}
                    {formatEntryDateTime(claim.converted_at)}
                  </li>
                )}
              </ol>
            </section>
            {claim.rejection_reason && (
              <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
                Motivo del rechazo: {claim.rejection_reason}
              </p>
            )}
            {claim.resulting_service_order_id && (
              <Link
                href={`/dashboard/servicios/${claim.resulting_service_order_id}`}
                className="inline-block rounded-full bg-blue px-4 py-2 text-sm font-semibold text-white"
              >
                Ver {claim.resulting_service_order_code ?? "ODS generada"}
              </Link>
            )}
            {canAuthorize &&
              claim.claim_type === "comeback" &&
              claim.status === "convertido_a_ods" && (
                <ClaimSupplierAction
                  claim={claim}
                  onUpdated={(updated) =>
                    setClaims((prev) =>
                      prev.map((c) => (c.id === updated.id ? updated : c)),
                    )
                  }
                />
              )}
            {error && (
              <p role="alert" className="text-sm text-red-700">
                {error}
              </p>
            )}
            {canAuthorize &&
              (claim.status === "solicitado" ||
                claim.brand_status === "en_marca" ||
                (claim.status === "autorizado" &&
                  !claim.resulting_service_order_id)) && (
                <section className="space-y-3 border-t border-navy/10 pt-5">
                  <h3 className="font-semibold text-navy">
                    Decisión del jefe de taller / gerente
                  </h3>
                  {claim.claim_type === "comeback" && (
                    <label className="flex items-start gap-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                      <input
                        type="checkbox"
                        checked={confirmed}
                        onChange={(event) => setConfirmed(event.target.checked)}
                        className="mt-1"
                      />
                      Confirmo que revisé el vehículo y las fotos, y que la
                      falla está relacionada con este trabajo.
                    </label>
                  )}
                  {claim.claim_type === "comeback" && (
                    <select
                      aria-label="Causa de la falla"
                      value={failure}
                      onChange={(e) =>
                        setFailure(e.target.value as ReworkFailureCategory)
                      }
                      className="w-full rounded-xl border border-navy/15 p-3 text-sm"
                    >
                      {Object.entries(failures).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  )}
                  <textarea
                    aria-label="Motivo del rechazo"
                    placeholder="Motivo del rechazo (obligatorio al rechazar)"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full rounded-xl border border-navy/15 p-3 text-sm"
                  />
                  <div className="flex flex-wrap gap-3">
                    <button
                      disabled={
                        busy || (claim.claim_type === "comeback" && !confirmed)
                      }
                      onClick={() => void act("aprobado")}
                      className="rounded-full bg-blue px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                    >
                      {busy
                        ? "Guardando…"
                        : claim.claim_type === "comeback"
                          ? "Autorizar y crear borrador"
                          : "Aprobar y crear borrador"}
                    </button>
                    <button
                      disabled={busy || !reason.trim()}
                      onClick={() => void act("rechazado")}
                      className="rounded-full border border-red-200 px-4 py-2 text-sm text-red-700 disabled:opacity-40"
                    >
                      Rechazar
                    </button>
                  </div>
                </section>
              )}
          </div>
        )}
      </Modal>
    </div>
  );
}
