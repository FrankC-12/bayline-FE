"use client";
import { useState } from "react";
import Link from "next/link";
import { Plus, Search, ShieldCheck, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import { useTemparios } from "@/hooks/useTemparios";
import { useLaborSettings } from "@/hooks/useLaborSettings";
import { duplicateTempario, setTemparioActive } from "@/lib/api/temparios";
import { categoryLabel } from "@/lib/temparios-categories";
import { formatMoney, formatCount } from "@/lib/format";
import ErrorState from "@/components/common/ErrorState";
import CreateTemparioModal from "./CreateTemparioModal";
import type { Tempario } from "@/types/tempario";
export default function TemparioListView() {
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;
  const { canEdit } = useModuleAccess("ajustes");
  const [search, setSearch] = useState("");
  const { temparios, loading, error, addTempario, editTempario, refresh } =
    useTemparios(filialId, search || undefined, true);
  const { settings } = useLaborSettings(filialId);
  const [detail, setDetail] = useState<Tempario | null>(null);
  const [editing, setEditing] = useState<Tempario | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  function warranty(t: Tempario) {
    if (t.legacy_warranty_label && t.warranty_mode === "standard")
      return t.legacy_warranty_label;
    return t.warranty_mode === "none"
      ? "Sin garantía"
      : `${t.warranty_mode === "custom" ? "Personalizada" : "Estándar"} · ${t.warranty_days ?? settings?.workshop_warranty_days ?? 90} d / ${formatCount(t.warranty_km ?? settings?.workshop_warranty_km ?? 5000)} km`;
  }
  async function action(kind: "duplicate" | "toggle") {
    if (!detail || busy) return;
    setBusy(true);
    setActionError(null);
    try {
      const result =
        kind === "duplicate"
          ? await duplicateTempario(detail.id)
          : await setTemparioActive(detail.id, !detail.is_active);
      setDetail(result);
      await refresh();
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar el tempario.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (!filialId) return null;
  return (
    <div>
      <div className="mb-5 flex flex-wrap justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-bold text-navy">
            Temparios
          </h2>
          <p className="mt-2 text-sm text-steel">
            Precios estimados con costos FIFO disponibles, margen e IVA. Las ODS
            existentes conservan sus tarifas y descuentos.
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
            className="flex items-center gap-2 rounded-full bg-blue px-5 py-3 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            Nuevo tempario
          </button>
        )}
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-4 top-3.5 h-4 w-4 text-steel" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nombre o código…"
          className="w-full rounded-full border border-navy/15 bg-white py-3 pl-11 pr-4 text-sm"
        />
      </div>
      <div className="mb-5 flex flex-wrap justify-between gap-2 text-sm text-steel">
        <p>
          {temparios.length} servicios · tarifa actual $
          {formatMoney(settings?.hourly_rate ?? 25)} / hora
        </p>
        <Link
          href="/dashboard/ajustes/mano-de-obra"
          className="font-semibold text-blue"
        >
          Cambiar tarifa →
        </Link>
      </div>
      {loading ? (
        <p className="p-8 text-sm text-steel">Cargando temparios…</p>
      ) : error ? (
        <ErrorState error={error} onRetry={refresh} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-navy/10 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-navy/10 text-xs uppercase text-steel">
              <tr>
                {[
                  "Código",
                  "Servicio",
                  "Categoría",
                  "Garantía",
                  "Horas",
                  "Subtotal",
                  "Total c/ IVA",
                ].map((label) => (
                  <th key={label} className="p-4 font-mono font-medium">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {temparios.map((t) => (
                <tr
                  key={t.id}
                  className={`border-b border-navy/5 ${!t.is_active ? "opacity-60" : ""}`}
                >
                  <td className="p-4 font-mono text-blue">{t.code}</td>
                  <td className="p-4">
                    <button
                      onClick={() => {
                        setDetail(t);
                        setActionError(null);
                      }}
                      className="text-left font-semibold text-navy underline"
                    >
                      {t.name}
                    </button>
                    {!t.is_active && (
                      <span className="ml-2 text-xs text-steel">Inactivo</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="whitespace-nowrap rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                      {categoryLabel(t.category)}
                    </span>
                  </td>
                  <td className="p-4 text-xs">{warranty(t)}</td>
                  <td className="p-4">{formatCount(t.estimated_hours)} h</td>
                  <td className="p-4">${formatMoney(t.total_price)}</td>
                  <td className="p-4 font-bold text-blue">
                    ${formatMoney(t.total_with_iva)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!temparios.length && (
            <p className="p-8 text-center text-steel">
              No hay servicios para esta búsqueda.
            </p>
          )}
        </div>
      )}
      {detail && (
        <div
          className="fixed inset-0 z-40 flex justify-end bg-navy/30"
          onClick={() => {
            if (!busy) setDetail(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="tempario-title"
            onClick={(event) => event.stopPropagation()}
            className="flex h-full w-full max-w-2xl flex-col bg-white shadow-xl"
          >
            <header className="flex items-start justify-between border-b border-navy/10 p-6">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-blue">
                    {detail.code}
                  </span>
                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800">
                    {categoryLabel(detail.category)}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-steel">
                    {detail.is_active ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <h3
                  id="tempario-title"
                  className="mt-3 font-display text-2xl font-bold"
                >
                  {detail.name}
                </h3>
              </div>
              <button
                aria-label="Cerrar detalle"
                onClick={() => setDetail(null)}
                disabled={busy}
              >
                <X className="h-5 w-5" />
              </button>
            </header>
            <div className="space-y-6 overflow-y-auto p-6">
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    label: "Horas",
                    value: `${formatCount(detail.estimated_hours)} h`,
                  },
                  {
                    label: "Subtotal",
                    value: `$${formatMoney(detail.total_price)}`,
                  },
                  {
                    label: "Total con IVA",
                    value: `$${formatMoney(detail.total_with_iva)}`,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`rounded-xl p-3 ${item.label === "Total con IVA" ? "bg-blue-light text-blue" : "bg-ash text-navy"}`}
                  >
                    <p className="text-xs text-steel">{item.label}</p>
                    <p className="mt-2 font-bold">{item.value}</p>
                  </div>
                ))}
              </div>
              <section>
                <h4 className="mb-3 font-mono text-xs uppercase text-blue">
                  Repuestos a utilizar
                </h4>
                {detail.parts.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[460px] text-left text-sm">
                      <caption className="sr-only">
                        Repuestos a utilizar: cantidades y precios
                      </caption>
                      <thead>
                        <tr className="border-b border-navy/10 text-[11px] font-semibold uppercase tracking-wide text-steel">
                          <th scope="col" className="py-3 pr-4">
                            Repuesto
                          </th>
                          <th scope="col" className="px-3 py-3 text-right">
                            Cantidad
                          </th>
                          <th scope="col" className="px-3 py-3 text-right">
                            PVP
                          </th>
                          <th scope="col" className="py-3 pl-3 text-right">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.parts.map((p) => (
                          <tr key={p.id} className="border-b border-navy/10">
                            <td className="py-3 pr-4 text-navy">{p.name}</td>
                            <td className="px-3 py-3 text-right tabular-nums">
                              {formatCount(p.quantity)}
                            </td>
                            <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums">
                              ${formatMoney(p.unit_price ?? p.unit_cost)}
                            </td>
                            <td className="whitespace-nowrap py-3 pl-3 text-right font-semibold tabular-nums">
                              ${formatMoney(p.line_total ?? p.subtotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <th
                            colSpan={3}
                            scope="row"
                            className="py-3 pr-3 font-normal text-steel"
                          >
                            Costo de repuestos
                          </th>
                          <td className="py-3 text-right font-semibold tabular-nums">
                            ${formatMoney(detail.parts_cost)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
                {!detail.parts.length && (
                  <p className="text-sm text-steel">
                    Este servicio no requiere repuestos.
                  </p>
                )}
              </section>
              <section className="border-t border-navy/5 pt-6">
                <div className="mb-3 flex justify-between gap-3">
                  <h4 className="font-mono text-xs uppercase text-blue">
                    Garantía
                  </h4>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(detail);
                        setOpen(true);
                      }}
                      className="text-xs font-semibold text-blue underline"
                    >
                      Cambiar
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-navy/10 p-4">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${detail.warranty_mode === "none" ? "bg-slate-100 text-steel" : "bg-emerald-100 text-emerald-800"}`}
                  >
                    <ShieldCheck aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <p className="text-sm font-semibold text-navy">
                    {warranty(detail)}
                  </p>
                </div>
                <p className="mt-2 text-xs text-steel">
                  {detail.warranty_mode === "none"
                    ? "Este servicio no incluye cobertura de garantía."
                    : "Cubre mano de obra y repuestos instalados. Vence lo que ocurra primero."}
                </p>
              </section>
              <section>
                <h4 className="mb-3 font-mono text-xs uppercase text-blue">
                  Vehículos compatibles
                </h4>
                <div className="flex flex-wrap gap-2">
                  {detail.compatible_vehicles.map((v) => (
                    <span
                      key={`${v.brand}|${v.model}`}
                      className="rounded-full bg-ash px-3 py-1 text-xs"
                    >
                      {v.brand} {v.model}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-xs text-steel">
                  Años: {detail.year_from ?? "todos"}
                  {detail.year_to ? ` – ${detail.year_to}` : ""}
                </p>
              </section>
              <section>
                <h4 className="mb-3 font-mono text-xs uppercase text-blue">
                  Herramientas
                </h4>
                <div className="flex flex-wrap gap-2">
                  {detail.tools.length ? (
                    detail.tools.map((tool) => (
                      <span
                        key={tool}
                        className="rounded-full bg-ash px-3 py-1 text-xs text-navy"
                      >
                        {tool}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-steel">No especificadas</p>
                  )}
                </div>
              </section>
              <section>
                <h4 className="mb-3 font-mono text-xs uppercase text-blue">
                  Precio calculado
                </h4>
                <p className="mb-3 text-xs text-steel">
                  Estimado con FIFO disponible y margen de 30 %. La tarifa, el
                  IVA y el margen de una ODS pueden variar según sus valores
                  guardados.
                </p>
                {detail.pricing_warnings?.map((warning) => (
                  <p
                    key={warning}
                    className="mb-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-900"
                  >
                    {warning}
                  </p>
                ))}
                <div className="space-y-2 rounded-xl bg-blue-light p-4 text-sm text-navy">
                  {[
                    { label: "Costo de repuestos", value: detail.parts_cost },
                    {
                      label: "Margen repuestos (30 %)",
                      value: detail.parts_margin,
                    },
                    {
                      label: `Mano de obra (${formatCount(detail.estimated_hours)} h × $${formatMoney(settings?.hourly_rate ?? 25)}/h)`,
                      value: detail.labor_cost,
                    },
                    { label: "Subtotal", value: detail.total_price },
                    {
                      label: `IVA (${detail.iva_percentage} %)`,
                      value: detail.iva_amount,
                    },
                    { label: "Total con IVA", value: detail.total_with_iva },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className={`flex justify-between gap-3 ${row.label === "Total con IVA" ? "border-t border-blue/15 pt-3 font-bold text-blue" : row.label === "Subtotal" ? "border-t border-blue/15 pt-3 font-semibold" : ""}`}
                    >
                      <span>{row.label}</span>
                      <span className="whitespace-nowrap tabular-nums">
                        ${formatMoney(row.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
              <p className="text-xs text-steel">
                Comisión del técnico ({settings?.commission_percentage ?? 30} %
                de mano de obra): $
                {formatMoney(
                  (detail.labor_cost *
                    (settings?.commission_percentage ?? 30)) /
                    100,
                )}
              </p>
              <p className="text-xs text-steel">
                Última edición:{" "}
                {detail.updated_by_name || "Usuario no registrado"} ·{" "}
                {new Date(detail.updated_at).toLocaleString("es-VE")}
              </p>
              {actionError && (
                <p role="alert" className="text-sm text-red-700">
                  {actionError}
                </p>
              )}
            </div>
            {canEdit && (
              <footer className="mt-auto flex flex-wrap justify-between gap-3 border-t border-navy/10 p-5">
                <button
                  disabled={busy}
                  onClick={() => void action("toggle")}
                  className="rounded-full border px-4 py-2 text-sm"
                >
                  {detail.is_active ? "Desactivar" : "Activar"}
                </button>
                <div className="flex gap-2">
                  <button
                    disabled={busy}
                    onClick={() => void action("duplicate")}
                    className="rounded-full border px-4 py-2 text-sm"
                  >
                    Duplicar
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => {
                      setEditing(detail);
                      setOpen(true);
                    }}
                    className="rounded-full bg-blue px-4 py-2 text-sm font-semibold text-white"
                  >
                    Editar tempario
                  </button>
                </div>
              </footer>
            )}
          </section>
        </div>
      )}
      <CreateTemparioModal
        open={open}
        onClose={() => setOpen(false)}
        filialId={filialId}
        hourlyRate={settings?.hourly_rate ?? 25}
        ivaPercentage={settings?.iva_percentage ?? 16}
        editingTempario={editing}
        onSubmit={async (input) => {
          if (editing) {
            const {
              category: omitted,
              filial_id: omittedFilial,
              ...rest
            } = input;
            void omitted;
            void omittedFilial;
            const updated = await editTempario(editing.id, rest);
            if (detail?.id === editing.id) setDetail(updated);
          } else await addTempario(input);
        }}
      />
    </div>
  );
}
