"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw, Plus, Search, ArrowUpRight, Building2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  getHoldingControl,
  type ControlReport,
  type Section,
  type Row,
  type Column,
} from "@/lib/api/holdingControl";
import { formatCount, formatEntryDateTime } from "@/lib/format";
import { classifyListError, type ListErrorInfo } from "@/lib/api/listError";
import ErrorState from "@/components/common/ErrorState";
import { localToday, renderCell } from "@/lib/holdingControlFormat";
import HoldingRegisterModal from "./HoldingRegisterModal";
import { WORKSHOP_STAGES } from "@/lib/workshopCalendar";

export const SECTIONS: Record<Section, { title: string; description: string }> =
  {
    tesoreria: {
      title: "Tesorería y flujo de caja",
      description:
        "Disponibilidad, movimientos, obligaciones y fondos entre filiales.",
    },
    comercial: {
      title: "Operaciones comerciales",
      description:
        "Ventas netas, metas por sede y seguimiento de oportunidades.",
    },
    inventario: {
      title: "Inventario centralizado",
      description: "Vehículos, existencias cruzadas y alertas de rotación.",
    },
    taller: {
      title: "Taller y postventa",
      description:
        "Ocupación de bahías y órdenes activas en todas las sucursales.",
    },
    contabilidad: {
      title: "Consolidación contable y fiscal",
      description:
        "Resultados operativos, libro contable y eliminaciones del grupo.",
    },
    actividad: {
      title: "Actividad y auditoría",
      description:
        "Eventos confirmados por usuario y filial, con alertas operativas.",
    },
  };
const phases = [
  "agendada",
  "en_revision",
  "esperando_repuestos",
  "en_trabajo",
  "por_facturar",
  "por_cobrar",
  "por_entregar",
].map((key) => ({ key, label: WORKSHOP_STAGES[key].label }));
export default function HoldingControlView({
  section,
  summary = false,
}: {
  section: Section;
  summary?: boolean;
}) {
  const { currentUser } = useAuth();
  const holdingId = currentUser?.holdingId;
  const [from, setFrom] = useState(() => `${localToday().slice(0, 7)}-01`);
  const [to, setTo] = useState(localToday);
  const [filial, setFilial] = useState("");
  const [filtersReady, setFiltersReady] = useState(false);
  useEffect(() => {
    setFiltersReady(false);
    const defaults = {
      from: `${localToday().slice(0, 7)}-01`,
      to: localToday(),
      filial: "",
    };
    let saved = defaults;
    try {
      const value = JSON.parse(
        sessionStorage.getItem(`holding-filters:${holdingId}`) ?? "null",
      );
      if (
        value &&
        /^\d{4}-\d{2}-\d{2}$/.test(value.from) &&
        /^\d{4}-\d{2}-\d{2}$/.test(value.to) &&
        value.from <= value.to &&
        typeof value.filial === "string"
      )
        saved = value;
    } catch {
      /* An unavailable browser store must not prevent reports. */
    }
    setFrom(saved.from);
    setTo(saved.to);
    setFilial(saved.filial);
    setFiltersReady(true);
  }, [holdingId]);
  useEffect(() => {
    if (!filtersReady || !holdingId) return;
    try {
      sessionStorage.setItem(
        `holding-filters:${holdingId}`,
        JSON.stringify({ from, to, filial }),
      );
    } catch {
      /* Optional persistence. */
    }
  }, [filtersReady, holdingId, from, to, filial]);
  const [search, setSearch] = useState("");
  const [state, setState] = useState<{
    scope: string;
    data: ControlReport | null;
    error: ListErrorInfo | null;
  }>({ scope: "", data: null, error: null });
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal] = useState(false);
  const [notice, setNotice] = useState("");
  const scope = `${holdingId}:${section}:${from}:${to}:${filial}`;
  const active = useRef(scope);
  active.current = scope;
  const sequence = useRef(0);
  const busy = useRef(false);
  const data = state.scope === scope ? state.data : null;
  const error = state.scope === scope ? state.error : null;
  const filialOptions = state.scope.startsWith(`${holdingId}:`)
    ? (state.data?.filiales ?? [])
    : [];
  const load = useCallback(
    async (background = false) => {
      if (
        !holdingId ||
        !filtersReady ||
        from > to ||
        (background && busy.current)
      )
        return;
      const revision = ++sequence.current;
      busy.current = true;
      if (!background) setRefreshing(true);
      try {
        const fresh = await getHoldingControl(
          holdingId,
          section,
          from,
          to,
          filial,
        );
        if (active.current === scope && revision === sequence.current)
          setState({ scope, data: fresh, error: null });
      } catch (err) {
        if (active.current === scope && revision === sequence.current)
          setState((old) => ({
            scope,
            data: old.scope === scope ? old.data : null,
            error: classifyListError(err),
          }));
      } finally {
        if (revision === sequence.current) {
          busy.current = false;
          setRefreshing(false);
        }
      }
    },
    [holdingId, section, from, to, filial, scope, filtersReady],
  );
  useEffect(() => {
    void load();
    const cancel = () => {
      sequence.current += 1;
      busy.current = false;
    };
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") void load(true);
    }, 30000);
    return () => {
      clearInterval(interval);
      cancel();
    };
  }, [load]);
  const filtered = (rows: Row[]) =>
    rows.filter(
      (row) =>
        !search ||
        Object.values(row).some(
          (v) =>
            typeof v !== "object" &&
            String(v ?? "")
              .toLowerCase()
              .includes(search.toLowerCase()),
        ),
    );
  const definition = summary
    ? {
        title: "Resumen de la red",
        description:
          "Ventas, costos y márgenes del mismo período y concesionarios que los módulos de control.",
      }
    : SECTIONS[section];
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-blue">
            Control del grupo
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold text-navy">
            {definition.title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-steel">
            {definition.description}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void load()}
            disabled={refreshing}
            className="rounded-full border border-navy/15 bg-white p-3 text-blue disabled:opacity-50"
            aria-label="Actualizar"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </button>
          {[
            "tesoreria",
            "comercial",
            "contabilidad",
            "inventario",
            "actividad",
          ].includes(section) && (
            <button
              type="button"
              onClick={() => setModal(true)}
              className="inline-flex items-center gap-2 rounded-full bg-blue px-5 py-2.5 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" /> Registrar
            </button>
          )}
        </div>
      </header>
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-navy/10 bg-white p-4">
        <label className="min-w-40 flex-1 text-xs text-steel">
          Sucursal
          <select
            value={filial}
            onChange={(e) => setFilial(e.target.value)}
            className="mt-1 block w-full rounded-xl border border-navy/15 bg-white px-3 py-2.5 text-sm text-navy"
          >
            <option value="">Todas las filiales</option>
            {filialOptions.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-steel">
          Desde
          <input
            aria-label="Desde"
            type="date"
            value={from}
            max={to}
            onChange={(e) => e.target.value && setFrom(e.target.value)}
            className="mt-1 block rounded-xl border border-navy/15 px-3 py-2 text-sm text-navy"
          />
        </label>
        <label className="text-xs text-steel">
          Hasta
          <input
            aria-label="Hasta"
            type="date"
            value={to}
            min={from}
            onChange={(e) => e.target.value && setTo(e.target.value)}
            className="mt-1 block rounded-xl border border-navy/15 px-3 py-2 text-sm text-navy"
          />
        </label>
        <label className="relative min-w-48 flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-steel" />
          <input
            aria-label="Buscar en el reporte"
            placeholder="Buscar en los resultados…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-navy/15 py-2.5 pl-9 pr-3 text-sm"
          />
        </label>
      </div>
      {notice && (
        <p
          role="status"
          className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800"
        >
          {notice}
        </p>
      )}
      {error && <ErrorState error={error} onRetry={() => void load()} />}
      {!data && !error && (
        <div
          role="status"
          className="rounded-2xl border border-navy/10 bg-white p-12 text-center text-steel"
        >
          Cargando información del holding…
        </div>
      )}
      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {data.metrics.map((m) => (
              <article
                key={m.label}
                className="rounded-2xl border border-navy/10 bg-white p-5"
              >
                <p className="text-sm text-steel">{m.label}</p>
                <p className="mt-3 break-words font-display text-2xl font-bold text-navy">
                  {renderCell(m.value, m.format, m.currency)}
                </p>
                {m.note && <p className="mt-2 text-xs text-steel">{m.note}</p>}
              </article>
            ))}
          </div>
          {data.notes.map((note) => (
            <p
              key={note}
              className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900"
            >
              {note}
            </p>
          ))}
          {data.tables.map((t) =>
            section === "taller" && t.title === "Órdenes por fase" ? (
              <section key={t.title} className="space-y-3">
                <h2 className="font-display text-lg font-bold text-navy">
                  {t.title}
                </h2>
                <div className="grid gap-3 lg:grid-cols-3 2xl:grid-cols-5">
                  {phases.map((phase) => {
                    const rows = filtered(t.rows).filter(
                      (row) => row.phase === phase.key,
                    );
                    return (
                      <div
                        key={phase.key}
                        className="rounded-2xl border border-navy/10 bg-slate-100/70 p-3"
                      >
                        <div className="mb-3 flex justify-between text-sm font-semibold text-navy">
                          <span>{phase.label}</span>
                          <span>{rows.length}</span>
                        </div>
                        <div className="space-y-3">
                          {rows.map((row) => (
                            <article
                              key={String(row.id)}
                              className="rounded-xl border border-navy/10 bg-white p-4"
                            >
                              <p className="font-mono text-xs font-semibold text-blue">
                                {String(row.code)}
                              </p>
                              <p className="mt-2 text-sm font-semibold">
                                {String(row.vehicle)}
                              </p>
                              <p className="mt-1 text-xs text-steel">
                                {String(row.plate || "Sin placa")}
                              </p>
                              <p className="mt-3 flex items-center gap-1 text-xs text-steel">
                                <Building2 className="h-3 w-3" />
                                {String(row.filial)}
                              </p>
                              <p className="mt-2 text-xs text-steel">
                                {formatCount(Number(row.hours))} h de ciclo
                              </p>
                            </article>
                          ))}
                          {!rows.length && (
                            <p className="rounded-xl border border-dashed border-navy/15 p-4 text-center text-xs text-steel">
                              Sin órdenes en esta fase
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-steel">{t.note}</p>
              </section>
            ) : (
              <section
                key={t.title}
                className="overflow-hidden rounded-2xl border border-navy/10 bg-white"
              >
                <div className="border-b border-navy/10 p-5">
                  <h2 className="font-display text-lg font-bold text-navy">
                    {t.title}
                  </h2>
                  {t.note && (
                    <p className="mt-1 text-xs leading-relaxed text-steel">
                      {t.note}
                    </p>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-ash/60 font-mono text-[10px] uppercase tracking-widest text-steel">
                      <tr>
                        {t.columns.map((c) => (
                          <th
                            key={c.key}
                            className="whitespace-nowrap px-5 py-3"
                          >
                            {c.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy/5">
                      {filtered(t.rows).map((row, index) => (
                        <tr
                          key={String(row.id ?? index)}
                          className="hover:bg-ash/40"
                        >
                          {t.columns.map((c: Column) => (
                            <td
                              key={c.key}
                              className={`px-5 py-4 ${c.format === "money" || c.format === "number" ? "whitespace-nowrap font-mono text-xs tabular-nums" : ""}`}
                            >
                              {c.format === "status" ? (
                                <span
                                  className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${/bajo|rotación|vencida|perdida|cancel/i.test(String(row[c.key])) ? "bg-amber-50 text-amber-900" : /activa|complet|ganada|disponible|create/i.test(String(row[c.key])) ? "bg-emerald-50 text-emerald-800" : "bg-blue-light text-blue"}`}
                                >
                                  {renderCell(row[c.key], c.format)}
                                </span>
                              ) : (
                                renderCell(
                                  row[c.key],
                                  c.format,
                                  String(row.currency ?? "usd"),
                                )
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!filtered(t.rows).length && (
                    <p className="p-8 text-center text-sm text-steel">
                      Sin registros para los filtros seleccionados.
                    </p>
                  )}
                </div>
              </section>
            ),
          )}
          <p className="text-xs text-steel">
            Actualizado: {formatEntryDateTime(data.generated_at)} · Consulta
            automática cada 30 segundos.
          </p>
        </>
      )}
      {!data?.filiales.length && data && (
        <Link
          href="/holding/filiales"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue"
        >
          Configurar filiales <ArrowUpRight className="h-4 w-4" />
        </Link>
      )}
      {modal && holdingId && (
        <HoldingRegisterModal
          holdingId={holdingId}
          section={section}
          filiales={data?.filiales ?? []}
          onClose={() => setModal(false)}
          onSaved={() => {
            setModal(false);
            setNotice("Registro guardado correctamente.");
            void load();
          }}
        />
      )}
    </div>
  );
}
