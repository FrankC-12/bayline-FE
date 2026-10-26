"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Plus, Search, FilePenLine, Trash2, Ban } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import { usePagedList } from "@/hooks/usePagedList";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  listServiceOrderPage,
  cancelServiceOrder,
  discardOrderDraft,
  type ServiceOrderPageItem,
} from "@/lib/api/serviceOrders";
import { formatEntryDateTime, formatCount } from "@/lib/format";
import Modal from "@/components/common/Modal";
import ErrorState from "@/components/common/ErrorState";
import Pagination from "@/components/common/Pagination";
import OrderTabs from "./OrderTabs";
export default function DraftsView() {
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId;
  const { canEdit } = useModuleAccess("asesor-servicios");
  const [search, setSearch] = useState("");
  const settled = useDebouncedValue(search.trim());
  const scope = JSON.stringify([currentUser?.userId, filialId, settled]);
  const list = usePagedList<ServiceOrderPageItem>(
    (page, size) =>
      filialId
        ? listServiceOrderPage(filialId, page, size, {
            view: "drafts",
            search: settled,
          })
        : Promise.resolve({
            items: [],
            total: 0,
            page: 1,
            page_size: size,
            total_pages: 1,
          }),
    scope,
    15000,
  );
  const [action, setAction] = useState<{
    order: ServiceOrderPageItem;
    kind: "delete" | "cancel";
  } | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const activeScope = useRef(scope);
  activeScope.current = scope;
  const [removed, setRemoved] = useState<{ scope: string; ids: string[] }>({
    scope,
    ids: [],
  });
  const rows = list.items.filter(
    (o) => removed.scope !== scope || !removed.ids.includes(o.id),
  );
  useEffect(() => {
    setRemoved((previous) => {
      if (previous.scope !== scope || !previous.ids.length) return previous;
      const ids = previous.ids.filter((id) =>
        list.items.some((item) => item.id === id),
      );
      return ids.length === previous.ids.length ? previous : { scope, ids };
    });
  }, [list.items, scope]);
  function open(order: ServiceOrderPageItem, kind: "delete" | "cancel") {
    setAction({ order, kind });
    setReason("");
    setError("");
  }
  async function confirm() {
    if (!action || pending.current || !canEdit) return;
    pending.current = true;
    setBusy(true);
    setError("");
    const submittedScope = scope;
    try {
      if (action.kind === "delete") await discardOrderDraft(action.order.id);
      else await cancelServiceOrder(action.order.id, reason.trim());
      if (activeScope.current !== submittedScope) return;
      setRemoved((old) => ({
        scope,
        ids: [...(old.scope === scope ? old.ids : []), action.order.id],
      }));
      setAction(null);
      await list.refresh();
    } catch (e) {
      if (activeScope.current === submittedScope)
        setError(
          e instanceof Error ? e.message : "No se pudo actualizar el borrador.",
        );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="min-w-0">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-blue">
            Órdenes de servicio
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold text-navy">
            Borradores
          </h1>
          <p className="mt-2 text-sm text-steel">
            Órdenes por preparar y enviar al taller. Continúa su edición o
            retira las que ya no se usarán.
          </p>
        </div>
        {canEdit && (
          <Link
            href="/dashboard/servicios/nueva"
            className="inline-flex items-center gap-2 rounded-xl bg-blue px-5 py-3 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            Crear ODS
          </Link>
        )}
      </header>
      <OrderTabs />
      <label className="mb-6 flex items-center gap-2 rounded-2xl border border-navy/10 bg-white px-4 py-3">
        <Search className="h-4 w-4 shrink-0 text-steel" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          maxLength={150}
          aria-label="Buscar borradores"
          placeholder="Buscar por ODS, cliente, vehículo o placa…"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none"
        />
      </label>
      {list.error ? (
        <ErrorState error={list.error} onRetry={list.refresh} />
      ) : list.loading ? (
        <p
          role="status"
          className="rounded-2xl border border-navy/10 bg-white p-10 text-center text-sm text-steel"
        >
          Cargando borradores…
        </p>
      ) : rows.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((order) => (
            <article
              key={order.id}
              className="min-w-0 rounded-2xl border border-navy/10 bg-white p-5"
            >
              <div className="flex items-center justify-between gap-2">
                <Link
                  href={`/dashboard/servicios/${order.id}`}
                  className="font-mono text-sm font-bold text-blue"
                >
                  {order.code}
                </Link>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-steel">
                  Borrador
                </span>
              </div>
              <h2 className="mt-4 font-display text-lg font-bold text-navy">
                {order.vehicle_label || "Sin vehículo seleccionado"}
              </h2>
              <p className="mt-1 text-xs text-steel">
                {order.vehicle_plate || "Sin placa"}
              </p>
              <p className="mt-3 truncate text-sm text-steel">
                {order.client_name || "Sin cliente seleccionado"}
              </p>
              <p className="mt-2 text-xs text-steel">
                Técnico: {order.technician_name || "Sin asignar"}
              </p>
              <p className="mt-2 text-xs text-steel">
                {formatCount(order.estimated_hours ?? 0)} h estimadas
              </p>
              <p className="mt-3 text-xs text-steel">
                Actualizado: {formatEntryDateTime(order.updated_at)}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-navy/10 pt-4">
                <Link
                  href={`/dashboard/servicios/${order.id}`}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue"
                >
                  <FilePenLine className="h-4 w-4" />
                  {canEdit ? "Continuar" : "Ver borrador"}
                </Link>
                {canEdit && (
                  <>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => open(order, "cancel")}
                      className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-steel"
                    >
                      <Ban className="h-3.5 w-3.5" />
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => open(order, "delete")}
                      aria-label={`Eliminar ${order.code}`}
                      className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                    >
                      <span className="inline-flex items-center gap-1">
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                      </span>
                    </button>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-navy/15 bg-white p-10 text-center">
          <h2 className="font-display text-lg font-bold text-navy">
            {search
              ? "No hay borradores que coincidan"
              : "No hay borradores pendientes"}
          </h2>
          <p className="mt-2 text-sm text-steel">
            {search
              ? "Prueba con otro cliente, placa o número de ODS."
              : "Las órdenes canceladas se conservan en el historial."}
          </p>
        </div>
      )}
      <Pagination {...list} />
      {action && (
        <Modal
          open
          title={`${action.kind === "delete" ? "Eliminar" : "Cancelar"} borrador ${action.order.code}`}
          onClose={() => {
            if (!busy) setAction(null);
          }}
          closeDisabled={busy}
          size="md"
          footer={
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => setAction(null)}
                className="rounded-full border border-navy/15 px-5 py-2.5 text-sm font-semibold"
              >
                Volver
              </button>
              <button
                type="button"
                disabled={
                  busy || (action.kind === "cancel" && reason.trim().length < 3)
                }
                onClick={() => void confirm()}
                className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {busy
                  ? "Guardando…"
                  : action.kind === "delete"
                    ? "Eliminar borrador"
                    : "Cancelar borrador"}
              </button>
            </>
          }
        >
          <div className="space-y-4 p-6">
            <p className="text-sm leading-relaxed text-steel">
              {action.kind === "delete"
                ? "Se eliminarán el borrador y sus tareas y repuestos pendientes. Esta acción no se puede deshacer."
                : "El borrador saldrá de esta bandeja y se conservará en el historial con el motivo y tu usuario."}
            </p>
            {action.kind === "cancel" && (
              <label className="block text-sm font-semibold text-navy">
                Motivo de cancelación
                <textarea
                  required
                  minLength={3}
                  maxLength={2000}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-xl border border-navy/15 p-3 text-sm"
                />
              </label>
            )}
            {error && (
              <p
                role="alert"
                className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
