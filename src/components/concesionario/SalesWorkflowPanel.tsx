"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, FileText, Upload, ShieldCheck, RefreshCw } from "lucide-react";
import {
  type Opportunity,
  type SalesAccount,
  salesAccounts,
  workflowAction,
  uploadOpportunityDocument,
  getOpportunity,
} from "@/lib/api/opportunities";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import { formatMoney } from "@/lib/format";
export default function SalesWorkflowPanel({
  opp,
  filialId,
  canEdit,
  onChange,
  pausePolling = false,
}: {
  opp: Opportunity;
  filialId: string;
  canEdit: boolean;
  onChange: (value: Opportunity) => void;
  pausePolling?: boolean;
}) {
  const data = opp.workflow;
  const { canEdit: canFinance } = useModuleAccess("administracion");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [provider, setProvider] = useState(data?.provider || "");
  const [external, setExternal] = useState(data?.external_reference || "");
  const [reference, setReference] = useState("");
  const [insurer, setInsurer] = useState(data?.insurer || "");
  const [policy, setPolicy] = useState(data?.policy_number || "");
  const [cancel, setCancel] = useState(false);
  const [reason, setReason] = useState("");
  const [accounts, setAccounts] = useState<SalesAccount[]>([]);
  const [refundAccount, setRefundAccount] = useState("");
  const [approved, setApproved] = useState(true);
  const editing =
    provider !== (data?.provider || "") ||
    external !== (data?.external_reference || "") ||
    insurer !== (data?.insurer || "") ||
    policy !== (data?.policy_number || "") ||
    !!reference ||
    !!reason ||
    cancel;
  const savedFields = useRef({
    provider: data?.provider || "",
    external: data?.external_reference || "",
    insurer: data?.insurer || "",
    policy: data?.policy_number || "",
  });
  useEffect(() => {
    const previous = savedFields.current;
    const latest = {
      provider: data?.provider || "",
      external: data?.external_reference || "",
      insurer: data?.insurer || "",
      policy: data?.policy_number || "",
    };
    setProvider((value) =>
      value === previous.provider ? latest.provider : value,
    );
    setExternal((value) =>
      value === previous.external ? latest.external : value,
    );
    setInsurer((value) =>
      value === previous.insurer ? latest.insurer : value,
    );
    setPolicy((value) => (value === previous.policy ? latest.policy : value));
    savedFields.current = latest;
  }, [
    data?.provider,
    data?.external_reference,
    data?.insurer,
    data?.policy_number,
  ]);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  useEffect(() => {
    let active = true;
    if (canFinance)
      salesAccounts(filialId)
        .then((v) => {
          if (active) setAccounts(v.filter((a) => a.currency === "usd"));
        })
        .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [filialId, canFinance]);
  useEffect(() => {
    if (
      !data?.enabled ||
      editing ||
      pausePolling ||
      opp.stage === "entregada" ||
      opp.stage === "perdida"
    )
      return;
    let active = true;
    const timer = setInterval(() => {
      getOpportunity(opp.id)
        .then((v) => {
          if (active) onChangeRef.current(v);
        })
        .catch(() => undefined);
    }, 20000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [opp.id, opp.stage, data?.enabled, editing, pausePolling]);
  if (!data?.enabled) return null;
  const field =
    "mt-1 w-full rounded-lg border border-navy/15 bg-white p-2.5 text-sm";
  async function run(fn: () => Promise<Opportunity>, clearForm = false) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      onChange(await fn());
      if (clearForm) {
        setReference("");
        setReason("");
        setCancel(false);
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo completar la operación.",
      );
    } finally {
      setBusy(false);
    }
  }
  const action = (
    path: string,
    body: Record<string, unknown>,
    method = "POST",
  ) =>
    run(
      () =>
        workflowAction(
          opp.id,
          path,
          { expected_version: opp.version, ...body },
          method,
        ),
      true,
    );
  function document(kind: string, label: string, disabled = false) {
    const file = data?.files[kind];
    return (
      <div
        key={kind}
        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-navy/5 bg-ash/50 p-3"
      >
        <div className="flex min-w-0 items-center gap-2">
          {file ? (
            <Check size={16} className="shrink-0 text-emerald-600" />
          ) : (
            <FileText size={16} className="shrink-0 text-steel" />
          )}
          <div>
            <p className="text-xs font-medium">{label}</p>
            {file && (
              <a
                href={file.download_url}
                target="_blank"
                rel="noreferrer"
                className="mt-1 block max-w-[260px] truncate text-[10px] text-blue underline"
              >
                {file.filename}
              </a>
            )}
          </div>
        </div>
        {canEdit && !disabled && (
          <label
            className={`cursor-pointer rounded-lg border bg-white px-3 py-1.5 text-xs ${busy ? "pointer-events-none opacity-50" : ""}`}
          >
            <Upload size={12} className="mr-1 inline" />
            {file ? "Sustituir" : "Adjuntar"}
            <input
              type="file"
              className="sr-only"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              disabled={busy}
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) void run(() => uploadOpportunityDocument(opp, kind, f));
              }}
            />
          </label>
        )}
      </div>
    );
  }
  const deposit = data.deposit;
  const financing = opp.sale_type === "financiado";
  const invoiced = !!opp.sale_id;
  const delivered = opp.stage === "entregada";
  const dead = opp.stage === "perdida";
  const financeStatus = data.financing_status;
  const missing = Object.keys(data.required_documents).filter(
    (k) => !data.files[k],
  );
  return (
    <div className="space-y-5">
      {error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      {deposit && (
        <section className="rounded-xl border border-navy/10 p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">
              {deposit.status === "devuelto"
                ? "Reserva cancelada"
                : "Reserva y abono"}
            </h3>
            <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] text-emerald-700">
              Registrado en Finanzas
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
            <p className="text-steel">
              Abono recibido
              <strong className="mt-1 block text-lg text-navy">
                $ {formatMoney(deposit.amount)}
              </strong>
            </p>
            <p className="text-steel">
              Referencia
              <strong className="mt-1 block break-words text-sm text-navy">
                {deposit.reference}
              </strong>
            </p>
          </div>
          {deposit.status === "devuelto" ? (
            <p className="mt-4 text-sm">
              Retención: $ {formatMoney(deposit.retained_amount || 0)} ·
              Devuelto: $ {formatMoney(deposit.refunded_amount || 0)}
            </p>
          ) : (
            !invoiced &&
            canFinance && (
              <button
                onClick={() => setCancel(!cancel)}
                className="mt-4 text-xs text-red-600 underline"
              >
                Cancelar reserva y registrar devolución
              </button>
            )
          )}
          {cancel && !invoiced && (
            <div className="mt-4 space-y-3 rounded-xl bg-red-50 p-4">
              <p className="text-xs">
                Retención acordada: {deposit.retention_percentage} %. Devolución
                estimada: ${" "}
                {formatMoney(
                  deposit.amount * (1 - deposit.retention_percentage / 100),
                )}
                .
              </p>
              <label className="block text-xs">
                Cuenta USD para la devolución
                <select
                  className={field}
                  value={refundAccount}
                  onChange={(e) => setRefundAccount(e.target.value)}
                >
                  <option value="">Selecciona…</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs">
                Referencia de devolución
                <input
                  className={field}
                  maxLength={60}
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
              </label>
              <label className="block text-xs">
                Motivo
                <textarea
                  className={field}
                  maxLength={500}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </label>
              <button
                disabled={
                  busy ||
                  reference.trim().length < 3 ||
                  reason.trim().length < 3
                }
                onClick={() =>
                  void action("reservation/cancel", {
                    account_id: refundAccount || null,
                    reference,
                    reason,
                  })
                }
                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
              >
                Confirmar devolución y liberar unidad
              </button>
            </div>
          )}
        </section>
      )}
      {financing && opp.quoted_at && !invoiced && !dead && (
        <section className="rounded-xl border border-navy/10 p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Recaudos de la financiadora</h3>
            <span className="text-xs text-steel">
              {10 - missing.length} de 10
            </span>
          </div>
          <div className="my-4 h-1.5 overflow-hidden rounded-full bg-ash">
            <div
              className="h-full bg-blue"
              style={{ width: `${(10 - missing.length) * 10}%` }}
            />
          </div>
          <a
            href={`/api/v1/vehicle-opportunities/${opp.id}/proforma/pdf`}
            target="_blank"
            rel="noreferrer"
            className="mb-2 flex items-center justify-between rounded-lg bg-blue-light/50 p-3 text-xs"
          >
            <span>✓ Cotización proforma</span>
            <span className="font-semibold text-blue">Ver PDF ↗</span>
          </a>
          <div className="space-y-2">
            {Object.entries(data.required_documents).map(([kind, label]) =>
              document(
                kind,
                label,
                ["enviada", "aprobado"].includes(financeStatus || ""),
              ),
            )}
          </div>
          {financeStatus === "enviada" ? (
            <div className="mt-4 rounded-lg bg-blue-light p-4 text-xs">
              Solicitud {data.external_reference} enviada a {data.provider}.
              Esperando su respuesta.
              {canFinance && (
                <div className="mt-4 space-y-3 border-t border-navy/10 pt-4">
                  <h4 className="font-semibold">
                    Registrar respuesta recibida de la financiera
                  </h4>
                  <select
                    className={field}
                    value={approved ? "yes" : "no"}
                    onChange={(e) => setApproved(e.target.value === "yes")}
                  >
                    <option value="yes">Crédito aprobado</option>
                    <option value="no">Crédito rechazado</option>
                  </select>
                  <label className="block">
                    Referencia o constancia de la respuesta
                    <input
                      className={field}
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      maxLength={500}
                    />
                  </label>
                  <button
                    disabled={busy || reference.trim().length < 3}
                    className="rounded-lg bg-blue px-4 py-2 text-white disabled:opacity-40"
                    onClick={() =>
                      void action("financing/decision", {
                        provider: data.provider,
                        external_reference: data.external_reference,
                        approved,
                        reference,
                      })
                    }
                  >
                    Registrar decisión externa
                  </button>
                </div>
              )}
            </div>
          ) : (
            financeStatus !== "aprobado" &&
            canEdit && (
              <div className="mt-4 space-y-3">
                <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                  {financeStatus === "rechazado"
                    ? `Crédito rechazado: ${data.decision_reference}. Puedes preparar otra solicitud.`
                    : "Envía los recaudos por el canal de la financiera y registra su número de solicitud. Esta acción no envía documentos automáticamente."}
                </p>
                <label className="block text-xs">
                  Financiera
                  <input
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className={field}
                    maxLength={50}
                  />
                </label>
                <label className="block text-xs">
                  Número o referencia de solicitud externa
                  <input
                    value={external}
                    onChange={(e) => setExternal(e.target.value)}
                    className={field}
                    maxLength={100}
                  />
                </label>
                <button
                  disabled={
                    busy ||
                    missing.length > 0 ||
                    !deposit ||
                    provider.trim().length < 2 ||
                    external.trim().length < 3
                  }
                  onClick={() =>
                    void action("financing/submit", {
                      provider,
                      external_reference: external,
                    })
                  }
                  className="rounded-lg bg-blue px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
                >
                  Registrar envío a financiera
                </button>
              </div>
            )
          )}
        </section>
      )}
      {financeStatus === "aprobado" && !invoiced && !dead && (
        <section className="space-y-4 rounded-xl border border-emerald-200 bg-emerald-50/30 p-5">
          <h3 className="flex items-center gap-2 font-semibold text-emerald-800">
            <ShieldCheck size={20} />
            Crédito aprobado
          </h3>
          <p className="text-xs text-steel">
            Referencia: {data.decision_reference}
          </p>
          <h4 className="text-sm font-semibold">Cierre del financiamiento</h4>
          {document("contrato", "Contrato tripartito firmado")}
          {document("poliza", "Póliza de seguro todo riesgo")}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs">
              Aseguradora
              <input
                className={field}
                value={insurer}
                onChange={(e) => setInsurer(e.target.value)}
                disabled={!canEdit}
                maxLength={150}
              />
            </label>
            <label className="text-xs">
              N.º de póliza
              <input
                className={field}
                value={policy}
                onChange={(e) => setPolicy(e.target.value)}
                disabled={!canEdit}
                maxLength={100}
              />
            </label>
          </div>
          {canEdit && (
            <button
              disabled={
                busy || insurer.trim().length < 2 || policy.trim().length < 2
              }
              onClick={() =>
                void action("financing/closing", {
                  insurer,
                  policy_number: policy,
                })
              }
              className="rounded-lg bg-blue px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
            >
              Guardar datos del seguro
            </button>
          )}
          <p className="text-xs text-steel">
            Al facturar se crea la ODS interna de PDI. La aprobación del crédito
            no se registra como dinero recibido.
          </p>
        </section>
      )}
      {invoiced && (
        <section className="space-y-4 rounded-xl border border-navy/10 p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">
              {delivered ? "Venta cerrada" : "Checklist de entrega"}
            </h3>
            <button
              aria-label="Actualizar estado"
              disabled={busy}
              onClick={() => void run(() => getOpportunity(opp.id))}
              className="rounded-lg border p-2"
            >
              <RefreshCw size={14} />
            </button>
          </div>
          {data.pdi && (
            <Link
              href={`/dashboard/servicios/${data.pdi.id}`}
              target="_blank"
              className="block rounded-lg bg-blue-light p-3 text-sm font-semibold text-blue"
            >
              {data.pdi.ready ? "✓ PDI completada" : "PDI pendiente en Taller"}{" "}
              · {data.pdi.code} ↗
              {data.pdi.is_draft && (
                <span className="mt-1 block text-[10px] font-normal">
                  Asigna técnico y envía el borrador al taller.
                </span>
              )}
            </Link>
          )}
          <label className="flex items-center gap-2 rounded-lg bg-ash p-3 text-xs">
            <input type="checkbox" checked={!!data.pdi?.ready} disabled />
            PDI completada (se actualiza desde Taller)
          </label>
          {Object.entries({
            documentos_entregados:
              "Documentos entregados: factura, certificado y manual",
            llaves_entregadas: "Llaves y duplicado entregados",
            funciones_explicadas: "Explicación de funciones al cliente",
            invitacion_app_enviada: "Invitación a la app enviada al cliente",
          }).map(([key, label]) => (
            <label
              key={key}
              className="flex items-center gap-2 rounded-lg border border-navy/10 p-3 text-xs"
            >
              <input
                type="checkbox"
                disabled={busy || delivered || !canEdit}
                checked={!!data.delivery?.[key]}
                onChange={(e) =>
                  void action(
                    "delivery/checklist",
                    {
                      documentos_entregados:
                        !!data.delivery?.documentos_entregados,
                      llaves_entregadas: !!data.delivery?.llaves_entregadas,
                      funciones_explicadas:
                        !!data.delivery?.funciones_explicadas,
                      invitacion_app_enviada:
                        !!data.delivery?.invitacion_app_enviada,
                      [key]: e.target.checked,
                    },
                    "PUT",
                  )
                }
              />
              {label}
            </label>
          ))}
          {document("acta_entrega", "Acta de entrega firmada", delivered)}
          <p className="text-xs text-steel">
            La invitación se confirma después de enviarla por tu canal habitual.
            Todos los puntos y el acta son obligatorios para entregar.
          </p>
          {delivered && (
            <div className="rounded-xl bg-emerald-50 p-5 text-center">
              <Check className="mx-auto mb-2 text-emerald-600" />
              <p className="font-semibold">Vehículo entregado al cliente</p>
              <p className="mt-2 text-xs text-steel">
                La venta, el vehículo, la PDI y las constancias permanecen
                vinculados.
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
