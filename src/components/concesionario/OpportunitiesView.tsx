"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useVehicleSalesAdvisors } from "@/hooks/useVehicleSalesAdvisors";
import { useClients } from "@/hooks/useClients";
import {
  listOpportunities,
  createOpportunity,
  STAGES,
  type OpportunityBoard,
  type Opportunity,
} from "@/lib/api/opportunities";
import { formatMoney, formatCount } from "@/lib/format";
import { LEAD_ORIGINS } from "@/lib/leads";
import Modal from "@/components/common/Modal";
import LeadFormModal from "@/components/clients/LeadFormModal";
import OpportunityDetailModal from "./OpportunityDetailModal";
export default function OpportunitiesView() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const filial = currentUser?.filialId || "";
  const { canEdit } = useModuleAccess("concesionario");
  const { users } = useVehicleSalesAdvisors(filial || null);
  const { clients } = useClients(filial || null);
  const [search, setSearch] = useState("");
  const term = useDebouncedValue(search);
  const [advisor, setAdvisor] = useState("");
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [report, setReport] = useState<OpportunityBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lead, setLead] = useState(false);
  const [existing, setExisting] = useState(false);
  const [clientId, setClientId] = useState("");
  const [busy, setBusy] = useState(false);
  const [detail, setDetail] = useState<Opportunity | null>(null);
  const sequence = useRef(0);
  useEffect(() => {
    setPage(1);
  }, [term, advisor, filial]);
  useEffect(() => {
    const id = ++sequence.current;
    if (!filial) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    listOpportunities(filial, term, advisor, page)
      .then((data) => {
        if (id === sequence.current) setReport(data);
      })
      .catch((err) => {
        if (id === sequence.current)
          setError(
            err instanceof Error
              ? err.message
              : "No se pudieron cargar las oportunidades.",
          );
      })
      .finally(() => {
        if (id === sequence.current) setLoading(false);
      });
  }, [filial, term, advisor, page, reload]);
  const refresh = () => setReload((value) => value + 1);
  async function addExisting() {
    if (!clientId || busy) return;
    setBusy(true);
    setError(null);
    try {
      const opp = await createOpportunity({
        filial_id: filial,
        client_id: clientId,
        origin: "walk_in",
      });
      setExisting(false);
      setDetail(opp);
      refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo crear la oportunidad.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="min-w-0 space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-navy">
            Oportunidades
          </h1>
          <p className="mt-2 text-sm text-steel">
            Da seguimiento a cada venta, desde el primer interés hasta la
            entrega.
          </p>
        </div>
        {canEdit && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setLead(true)}
              className="rounded-full bg-blue px-4 py-2.5 text-sm font-semibold text-white"
            >
              + Nuevo prospecto
            </button>
            <button
              onClick={() => setExisting(true)}
              className="rounded-full border border-navy/15 bg-white px-4 py-2.5 text-sm font-semibold text-navy"
            >
              Cliente existente
            </button>
          </div>
        )}
      </header>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            label: "Oportunidades abiertas",
            value: Object.entries(report?.counts || {})
              .filter(
                ([key]) => !["entregada", "perdida", "facturada"].includes(key),
              )
              .reduce((sum, [, value]) => sum + value, 0),
          },
          { label: "Ventas facturadas", value: report?.counts.facturada || 0 },
          {
            label: "Vehículos entregados",
            value: report?.counts.entregada || 0,
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-navy/10 bg-white p-4"
          >
            <p className="text-xs text-steel">{item.label}</p>
            <p className="mt-2 text-2xl font-bold text-navy">
              {loading ? "—" : formatCount(item.value)}
            </p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 rounded-2xl border border-navy/10 bg-white p-4">
        <input
          aria-label="Buscar oportunidades"
          maxLength={150}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por cliente, documento o vehículo…"
          className="min-w-0 flex-1 rounded-xl border border-navy/15 px-4 py-2.5 text-sm"
        />
        <select
          aria-label="Filtrar por vendedor"
          value={advisor}
          onChange={(e) => setAdvisor(e.target.value)}
          className="rounded-xl border border-navy/15 bg-white px-3 text-sm"
        >
          <option value="">Todos los vendedores</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.full_name}
            </option>
          ))}
        </select>
        <button
          onClick={refresh}
          className="px-3 text-sm font-semibold text-blue"
        >
          Actualizar
        </button>
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      {loading ? (
        <p
          role="status"
          className="rounded-2xl bg-white p-10 text-center text-sm text-steel"
        >
          Cargando oportunidades…
        </p>
      ) : (
        report && (
          <>
            <div className="overflow-x-auto pb-3">
              <div className="grid min-w-[1740px] grid-cols-7 gap-3">
                {Object.entries(STAGES).map(([stage, label]) => (
                  <section
                    key={stage}
                    className="rounded-2xl border border-navy/5 bg-slate-100/80 p-3"
                  >
                    <h2 className="mb-4 flex items-center justify-between text-sm font-bold text-navy">
                      {label}
                      <span className="rounded-full bg-white px-2 py-0.5 text-xs">
                        {formatCount(report.counts[stage] || 0)}
                      </span>
                    </h2>
                    <div className="space-y-3">
                      {report.items
                        .filter((item) => item.stage === stage)
                        .map((item) => (
                          <button
                            key={item.id}
                            onClick={() =>
                              router.push(
                                `/dashboard/concesionario/oportunidades/${item.id}`,
                              )
                            }
                            className="w-full rounded-xl border border-navy/10 bg-white p-4 text-left shadow-sm transition hover:border-blue/30 hover:shadow-md"
                          >
                            <p className="font-semibold text-navy">
                              {item.client_name}
                            </p>
                            <p className="mt-2 text-xs text-steel">
                              {item.vehicle_label || "Sin unidad cotizada"}
                            </p>
                            <p className="mt-2 text-base font-bold text-navy">
                              {item.amount == null
                                ? "—"
                                : `${item.currency === "VES" ? "Bs." : "$"} ${formatMoney(item.amount)}`}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              <span className="rounded-full bg-blue-light px-2 py-1 text-[10px] text-blue">
                                {item.advisor_name || "Sin asignar"}
                              </span>
                              <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] text-steel">
                                {LEAD_ORIGINS[item.origin] || item.origin}
                              </span>
                              {item.sale_type === "financiado" && (
                                <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] text-emerald-800">
                                  Financiado
                                </span>
                              )}
                              {item.vehicle_status === "en_transito" && (
                                <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] text-amber-800">
                                  Unidad en tránsito
                                </span>
                              )}
                            </div>
                          </button>
                        ))}
                      {!report.items.some((item) => item.stage === stage) && (
                        <p className="rounded-xl border border-dashed border-navy/10 p-4 text-center text-xs text-steel">
                          Sin oportunidades en esta página
                        </p>
                      )}
                    </div>
                  </section>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-steel">
              <span>
                {report.items.length} de {formatCount(report.total)}{" "}
                oportunidades · Página {page} de {report.total_pages}
              </span>
              <div className="flex gap-3">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((value) => value - 1)}
                  className="disabled:opacity-30"
                >
                  Anterior
                </button>
                <button
                  disabled={page >= report.total_pages}
                  onClick={() => setPage((value) => value + 1)}
                  className="disabled:opacity-30"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </>
        )
      )}
      {lead && (
        <LeadFormModal
          filialId={filial}
          defaultOrigin="walk_in"
          defaultInterest="vehiculo"
          onClose={() => setLead(false)}
          onSaved={() => {
            setLead(false);
            refresh();
          }}
        />
      )}
      {existing && (
        <Modal
          open
          onClose={() => setExisting(false)}
          closeDisabled={busy}
          title="Nueva oportunidad"
        >
          <div className="space-y-4 p-6">
            <label className="block text-sm text-navy">
              Cliente
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="mt-2 w-full rounded-xl border border-navy/15 bg-white px-3 py-3"
              >
                <option value="">Selecciona un cliente o lead…</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.full_name} · {client.document_number}
                  </option>
                ))}
              </select>
            </label>
            <button
              disabled={busy || !clientId}
              onClick={() => void addExisting()}
              className="rounded-full bg-blue px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy ? "Creando…" : "Crear oportunidad"}
            </button>
            {error && (
              <p role="alert" className="text-sm text-red-700">
                {error}
              </p>
            )}
          </div>
        </Modal>
      )}
      {detail && (
        <OpportunityDetailModal
          initial={detail}
          filialId={filial}
          canEdit={canEdit}
          onClose={() => setDetail(null)}
          onChanged={refresh}
        />
      )}
    </div>
  );
}
