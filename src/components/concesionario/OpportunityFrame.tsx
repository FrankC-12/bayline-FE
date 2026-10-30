"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import Modal from "@/components/common/Modal";
import { STAGES, type Opportunity } from "@/lib/api/opportunities";
import { formatMoney, formatEntryDate } from "@/lib/format";
import { LEAD_ORIGINS } from "@/lib/leads";
export default function OpportunityFrame({
  opp,
  fullPage,
  children,
  onClose,
  closeDisabled,
}: {
  opp: Opportunity;
  fullPage: boolean;
  children: ReactNode;
  onClose: () => void;
  closeDisabled: boolean;
}) {
  if (!fullPage)
    return (
      <Modal
        open
        onClose={onClose}
        closeDisabled={closeDisabled}
        size="lg"
        title={opp.client_name}
        description={`${opp.code} · ${STAGES[opp.stage]}`}
      >
        {children}
      </Modal>
    );
  const stages = Object.keys(STAGES).filter((s) => s !== "perdida");
  const active = stages.indexOf(opp.stage);
  return (
    <div>
      <Link
        href="/dashboard/concesionario/oportunidades"
        className="text-xs text-blue"
      >
        ← Oportunidades de venta
      </Link>
      <header className="my-6 flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0c4250] text-sm font-semibold text-white">
          {opp.client_name.slice(0, 2).toUpperCase()}
        </span>
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl font-bold">
              {opp.client_name}
            </h1>
            <span className="rounded-full bg-blue-light px-2 py-1 text-[10px] font-semibold text-blue">
              {STAGES[opp.stage]}
            </span>
          </div>
          <p className="mt-2 text-xs text-steel">
            {[
              opp.client_document,
              opp.client_phone,
              opp.advisor_name,
              LEAD_ORIGINS[opp.origin] || opp.origin,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      </header>
      <ol
        aria-label="Etapas de venta"
        className="mb-6 flex flex-wrap gap-y-3 rounded-xl border border-black/5 bg-white p-4"
      >
        {stages.map((stage, i) => (
          <li
            key={stage}
            aria-current={i === active ? "step" : undefined}
            className="flex min-w-[100px] flex-1 items-center gap-2"
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] ${i <= active ? "border-blue bg-blue text-white" : "border-black/10 text-steel"}`}
            >
              {i < active ? "✓" : i + 1}
            </span>
            <span
              className={`text-[11px] ${i <= active ? "font-semibold text-blue" : "text-steel"}`}
            >
              {STAGES[stage]}
            </span>
            {i < stages.length - 1 && (
              <span
                className={`mx-2 h-px flex-1 ${i < active ? "bg-blue" : "bg-black/10"}`}
              />
            )}
          </li>
        ))}
      </ol>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 rounded-2xl border border-black/5 bg-white">
          {children}
        </div>
        <aside className="space-y-5">
          <section className="rounded-2xl border border-black/5 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold">Resumen de la venta</h2>
            <div className="rounded-xl bg-ash p-4">
              <p className="text-sm font-semibold">
                {opp.vehicle_label || "Aún no hay vehículo cotizado"}
              </p>
              <p className="mt-2 text-xs text-steel">{opp.code}</p>
            </div>
            <dl className="mt-4 divide-y divide-black/5 text-xs">
              {[
                [
                  "Precio cotizado",
                  opp.quoted_amount == null
                    ? "—"
                    : `${opp.currency} ${formatMoney(opp.quoted_amount)}`,
                ],
                [
                  "Forma de pago",
                  opp.sale_type === "financiado" ? "Financiado" : "Contado",
                ],
                [
                  "Vigencia",
                  opp.quote_expires_at
                    ? formatEntryDate(opp.quote_expires_at + "T12:00:00")
                    : "—",
                ],
                ["Descuento", `${opp.discount_percentage || 0} %`],
                [
                  "Abono",
                  opp.workflow?.deposit?.status === "registrado"
                    ? `USD ${formatMoney(opp.workflow.deposit.amount)}`
                    : "—",
                ],
                [
                  "Financiamiento",
                  opp.sale_type !== "financiado"
                    ? "No aplica"
                    : {
                        enviada: "Esperando decisión",
                        aprobado: "Aprobado",
                        rechazado: "Rechazado",
                      }[opp.workflow?.financing_status || ""] ||
                      "Recaudos pendientes",
                ],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3 py-3">
                  <dt className="text-steel">{label}</dt>
                  <dd className="text-right font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="rounded-2xl border border-black/5 bg-white p-5">
            <h2 className="mb-5 text-sm font-semibold">
              Actividad{" "}
              <span className="float-right text-[10px] font-normal text-steel">
                {opp.activity.length} eventos
              </span>
            </h2>
            <ol className="space-y-5 border-l border-blue/20 pl-4">
              {opp.activity
                .slice()
                .reverse()
                .map((item, i) => (
                  <li key={i} className="relative text-xs">
                    <span className="absolute -left-[19px] top-1 h-1.5 w-1.5 rounded-full bg-blue" />
                    <p className="font-semibold">
                      {STAGES[item.action] || item.action.replaceAll("_", " ")}
                    </p>
                    {item.note && (
                      <p className="mt-1 break-words text-steel">{item.note}</p>
                    )}
                    <time className="mt-1 block text-[10px] text-steel">
                      {formatEntryDate(item.at)}
                    </time>
                  </li>
                ))}
            </ol>
          </section>
        </aside>
      </div>
    </div>
  );
}
