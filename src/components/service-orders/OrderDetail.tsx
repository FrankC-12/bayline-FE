"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ChevronLeft, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useServiceOrder } from "@/hooks/useServiceOrder";
import { useVehicleLookup } from "@/hooks/useVehicleLookUp";
import { useUsers } from "@/hooks/useUser";
import { useRoles } from "@/hooks/useRoles";
import { useBays } from "@/hooks/useBays";
import { useInspectionForOrder } from "@/hooks/useInspectionForOrder";
import { useInspections } from "@/hooks/useInspections";
import { useOrderSummary } from "@/hooks/useOrderSummary";
import { useTemparios } from "@/hooks/useTemparios";
import TasksCard from "./TaskCard";
import TransfersCard from "./TransferCard";
import CoverageBreakdownCard from "./CoverageBreakdownCard";
import PriceSummaryCard from "./PriceSummaryCard";
import BillingModal from "./BillingModal";
import WarrantyClaimModal from "./WarrantyClaimModal";
import { closeServiceOrder } from "@/lib/api/serviceOrderBilling";
import { formatElapsed } from "@/lib/time";
import LiveDot from "@/components/common/LiveDot";

const STATUS_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  completado: "Completado",
  orden_cerrada: "Orden cerrada",
  cancelado: "Cancelado",
};

const STATUS_STYLES: Record<string, string> = {
  pendiente: "bg-amber-100 text-amber-700",
  en_progreso: "bg-blue-light text-blue",
  completado: "bg-emerald-100 text-emerald-700",
  orden_cerrada: "bg-slate-100 text-slate-600",
  cancelado: "bg-red-100 text-red-700",
};

const TYPE_LABELS: Record<string, string> = { regular: "Regular", mpt: "MPT" };

interface OrderDetailProps {
  orderId: string;
}

export default function OrderDetail({ orderId }: OrderDetailProps) {
  const router = useRouter();
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;
  const toast = useToast();

  const { order, loading, error, update, refresh: refreshOrder } = useServiceOrder(orderId);
  const { vehicleMap } = useVehicleLookup(filialId);
  const { users } = useUsers({ filialId });
  const { roles } = useRoles("filial");
  const { bays } = useBays(filialId);
  const { inspection, link } = useInspectionForOrder(order?.id ?? null);
  const { inspections: unlinkedInspections } = useInspections(filialId, true);
  const {
    summary,
    refresh: refreshSummary,
    addTask,
    toggleTaskStatus,
    changeTaskPayer,
    removeTask,
    addTransferLine,
    changeLinePayer,
    markOrdered,
    dismissWarnings,
  } = useOrderSummary(order?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [billingOpen, setBillingOpen] = useState(false);
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [closePanelOpen, setClosePanelOpen] = useState(false);
  const [nextMaintenanceDate, setNextMaintenanceDate] = useState("");
  const [temparioSearch, setTemparioSearch] = useState("");
  const [nextMaintenanceTempario, setNextMaintenanceTempario] = useState<{ id: string; code: string; name: string } | null>(null);
  const { temparios: temparioResults } = useTemparios(filialId, temparioSearch || undefined);
  const [addingPlanTask, setAddingPlanTask] = useState(false);
  const [elapsed, setElapsed] = useState(() => (order ? formatElapsed(order.created_at, order.closed_at) : ""));

  useEffect(() => {
    if (!order || order.closed_at) return;
    setElapsed(formatElapsed(order.created_at));
    const interval = setInterval(() => setElapsed(formatElapsed(order.created_at)), 1000);
    return () => clearInterval(interval);
  }, [order]);

  const technicianRoleId = roles.find((r) => r.slug === "tecnico")?.id;
  const technicians = users.filter((u) => u.role_id === technicianRoleId);

  if (loading) {
    return <div className="p-12 text-center text-sm text-steel">Cargando orden...</div>;
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
        <h1 className="mt-4 font-display text-xl font-bold text-navy">No se pudo cargar la orden</h1>
        <p className="mt-2 text-sm text-steel">
          La orden de servicio no existe, fue eliminada, o el enlace es inválido.
        </p>
        <Link
          href="/dashboard/servicios"
          className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy"
        >
          <ChevronLeft className="h-4 w-4" />
          Volver a Órdenes de Servicio
        </Link>
      </div>
    );
  }

  const info = vehicleMap.get(order.vehicle_id);
  const readOnly = !!order.invoiced_at || order.status === "orden_cerrada" || order.status === "cancelado";

  const pendingPlanTemparioId = info?.vehicle.next_maintenance_tempario_id ?? null;
  const pendingPlanAlreadyAdded = !!(
    pendingPlanTemparioId && summary?.tasks.some((t) => t.tempario_id === pendingPlanTemparioId)
  );
  const showPendingPlanBanner = !readOnly && !!pendingPlanTemparioId && !pendingPlanAlreadyAdded;

  async function addPlanTask() {
    if (!pendingPlanTemparioId) return;
    setAddingPlanTask(true);
    setActionError(null);
    try {
      await addTask(pendingPlanTemparioId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "No se pudo cargar la tarea del plan.");
    } finally {
      setAddingPlanTask(false);
    }
  }

  async function finishOrder() {
    if (!order?.invoiced_at || order.status !== "completado") return;
    setSaving(true); setActionError(null);
    try {
      await closeServiceOrder(orderId, nextMaintenanceDate || null, nextMaintenanceTempario?.id ?? null);
      await refreshOrder(); await refreshSummary();
      setClosePanelOpen(false);
      toast.success("Orden cerrada.");
    }
    catch (err) { setActionError(err instanceof Error ? err.message : "No se pudo cerrar la orden."); }
    finally { setSaving(false); }
  }

  const STATUS_TRANSITION_TOAST: Record<string, string> = {
    en_progreso: "Orden iniciada.",
    completado: "Orden marcada como completada.",
    cancelado: "Orden cancelada.",
  };

  async function transition(status: string) {
    if (readOnly) return;
    setSaving(true);
    try {
      await update({ status });
      await refreshSummary();
      if (STATUS_TRANSITION_TOAST[status]) toast.success(STATUS_TRANSITION_TOAST[status]);
    } finally {
      setSaving(false);
    }
  }

  async function changeDiscount(discount_label: import("@/lib/partsPricing").DiscountLabel) {
    if (readOnly) return;
    setSaving(true);
    try {
      await update({ discount_label });
      await refreshSummary();
    } finally {
      setSaving(false);
    }
  }

  async function assignTechnician(value: string) {
    if (readOnly) return;
    setSaving(true);
    try {
      await update(value === "" ? { clear_technician: true } : { technician_user_id: value });
    } finally {
      setSaving(false);
    }
  }

  async function assignBay(value: string) {
    if (readOnly) return;
    setSaving(true);
    try {
      await update(value === "" ? { clear_bay: true } : { bay_id: value });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-w-0">
      <button
        onClick={() => router.push("/dashboard/servicios")}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-steel hover:text-navy"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver a Órdenes de Servicio
      </button>

      <div className="rounded-2xl border border-navy/10 bg-white p-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-lg font-bold text-blue">{order.code}</span>
          <span
            className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest ${STATUS_STYLES[order.status]}`}
          >
            {STATUS_LABELS[order.status]}
          </span>
          <span className="rounded-full bg-ash px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-steel">
            {TYPE_LABELS[order.order_type]}
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-navy/15 px-2.5 py-1 font-mono text-xs text-navy">
            {!order.closed_at && <LiveDot />}
            <Clock className="h-3.5 w-3.5" />
            {elapsed}
          </span>
        </div>

        <h1 className="mt-3 font-display text-2xl font-bold text-navy">
          {info ? `${info.vehicle.brand} ${info.vehicle.model} ${info.vehicle.year ?? ""}` : "Vehículo"}
        </h1>
        <p className="text-sm text-steel">
          {info?.vehicle.plate} · {info?.client.full_name} · Técnico: {users.find((u) => u.id === order.technician_user_id)?.full_name ?? "Sin asignar"}
        </p>

        {inspection && <p className="mt-4 inline-flex rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800">✓ Inspección preliminar vinculada</p>}

        <div className="mt-5 flex flex-wrap gap-3 border-t border-navy/10 pt-5">
          {order.status === "pendiente" && (
            <button
              onClick={() => transition("en_progreso")}
              disabled={saving || readOnly}
              className="rounded-full bg-blue px-5 py-2 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-60"
            >
              Iniciar
            </button>
          )}
          {order.status === "en_progreso" && (
            <button
              onClick={() => transition("completado")}
              disabled={saving || readOnly}
              className="rounded-full bg-blue px-5 py-2 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-60"
            >
              Marcar como completado
            </button>
          )}
          {order.status === "completado" && <>
            <button onClick={() => setBillingOpen(true)} disabled={saving}
              className="rounded-full bg-blue px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {order.invoiced_at ? "Ver factura y cobro" : "Facturar"}
            </button>
            <button onClick={() => setClosePanelOpen(true)} disabled={saving || !order.invoiced_at || closePanelOpen}
              title={!order.invoiced_at ? "Primero debes facturar y registrar el cobro" : undefined}
              className="rounded-full bg-navy px-5 py-2 text-sm font-semibold text-white disabled:opacity-40">
              Cerrar orden
            </button>
          </>}
          {order.status === "orden_cerrada" && order.invoiced_at && <button onClick={() => setBillingOpen(true)}
            className="rounded-full border border-blue px-5 py-2 text-sm font-semibold text-blue">Ver factura y cobro</button>}
          {order.invoiced_at && <button onClick={() => setClaimModalOpen(true)}
            className="rounded-full border border-navy/15 px-5 py-2 text-sm font-semibold text-navy transition hover:border-blue hover:text-blue">
            Reclamos de garantía
          </button>}
          {actionError && <p role="alert" className="w-full text-sm text-red-600">{actionError}</p>}
          {(order.status === "pendiente" || order.status === "en_progreso") && (
            <button
              onClick={() => transition("cancelado")}
              disabled={saving || readOnly}
              className="rounded-full border border-red-200 px-5 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
            >
              Cancelar orden
            </button>
          )}
        </div>

        {closePanelOpen && (
          <div className="mt-5 rounded-xl bg-ash p-4">
            <label className="mb-1.5 block text-sm font-medium text-navy">
              Próxima visita sugerida (opcional)
            </label>
            <p className="mb-2 text-xs text-steel">
              Si el vehículo aplica, alimenta el listado de mantenimiento por vencer en Torre de
              Control.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="date"
                value={nextMaintenanceDate}
                onChange={(e) => setNextMaintenanceDate(e.target.value)}
                className="rounded-xl border border-navy/15 px-3 py-2 text-sm outline-none focus:border-blue"
              />
            </div>

            <label className="mb-1.5 mt-4 block text-sm font-medium text-navy">
              Tarea del plan pendiente (opcional)
            </label>
            {nextMaintenanceTempario ? (
              <div className="flex items-center gap-2 rounded-xl border border-navy/15 bg-white px-3 py-2 text-sm">
                <span className="font-mono text-blue">{nextMaintenanceTempario.code}</span>
                <span className="text-navy">{nextMaintenanceTempario.name}</span>
                <button
                  onClick={() => setNextMaintenanceTempario(null)}
                  className="ml-auto text-xs font-medium text-steel hover:text-navy"
                >
                  Quitar
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  value={temparioSearch}
                  onChange={(e) => setTemparioSearch(e.target.value)}
                  placeholder="Buscar tarea del catálogo — código o nombre..."
                  className="w-full rounded-xl border border-navy/15 px-3 py-2 text-sm outline-none focus:border-blue"
                />
                {temparioSearch && temparioResults.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full divide-y divide-navy/5 rounded-xl border border-navy/10 bg-white shadow-lg">
                    {temparioResults.slice(0, 6).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setNextMaintenanceTempario({ id: t.id, code: t.code, name: t.name });
                          setTemparioSearch("");
                        }}
                        className="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-ash"
                      >
                        <span>
                          <span className="font-mono text-blue">{t.code}</span>{" "}
                          <span className="text-navy">{t.name}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                onClick={finishOrder}
                disabled={saving}
                className="rounded-full bg-navy px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                Confirmar cierre
              </button>
              <button
                onClick={() => {
                  setClosePanelOpen(false);
                  setNextMaintenanceDate("");
                  setNextMaintenanceTempario(null);
                  setTemparioSearch("");
                }}
                disabled={saving}
                className="text-sm font-medium text-steel hover:text-navy"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-navy/10 bg-white p-6">
        <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-steel">Datos de recepción</p>
        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-steel">Kilometraje de ingreso</p>
            <p className="mt-0.5 text-sm font-semibold text-navy">
              {order.intake_mileage != null ? `${order.intake_mileage.toLocaleString("es-VE")} km` : "—"}
            </p>
            {order.intake_mileage == null && !readOnly && (
              <p className="mt-0.5 text-[11px] text-steel">Se registra al vincular la inspección preliminar.</p>
            )}
          </div>
          <div>
            <p className="text-xs text-steel">Asesor responsable</p>
            <p className="mt-0.5 text-sm font-semibold text-navy">
              {users.find((u) => u.id === order.advisor_user_id)?.full_name ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-steel">Fecha prometida de entrega</p>
            <p className="mt-0.5 text-sm font-semibold text-navy">
              {order.promised_at ? new Date(`${order.promised_at}T12:00:00`).toLocaleDateString("es-VE") : "—"}
            </p>
          </div>
          <div className="sm:col-span-1">
            <p className="text-xs text-steel">Motivo del cliente</p>
            <p className="mt-0.5 text-sm font-semibold text-navy">{order.customer_reason ?? "—"}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-3">
        <div className="rounded-2xl border border-navy/10 bg-white p-5">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-steel">Creación</p>
          <p className="font-semibold text-navy">{new Date(order.created_at).toLocaleString("es-VE", { dateStyle: "long", timeStyle: "short" })}</p>
          <span className="mt-4 inline-flex items-center gap-2 rounded-xl border border-navy/10 bg-ash px-3 py-2 font-mono font-semibold text-blue"><Clock className="h-4 w-4" />{elapsed}</span>
        </div>
        <div className="rounded-2xl border border-navy/10 bg-white p-5">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-steel">
            Técnico asignado
          </p>
          <select
            disabled={readOnly || saving}
            value={order.technician_user_id ?? ""}
            onChange={(e) => assignTechnician(e.target.value)}
            className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
          >
            <option value="">Sin asignar</option>
            {technicians.map((t) => (
              <option key={t.id} value={t.id}>
                {t.full_name}
              </option>
            ))}
          </select>

          <p className="mb-3 mt-5 font-mono text-[11px] uppercase tracking-widest text-steel">
            Bahía a utilizar
          </p>
          <select
            disabled={readOnly || saving}
            value={order.bay_id ?? ""}
            onChange={(e) => assignBay(e.target.value)}
            className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
          >
            <option value="">Sin asignar</option>
            {bays.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-2xl border border-navy/10 bg-white p-5">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-steel">
            Vehículo asignado
          </p>
          {info ? (
            <div>
              <p className="font-display font-bold text-navy">
                {info.vehicle.brand} {info.vehicle.model}
              </p>
              <p className="font-mono text-sm text-blue">{info.vehicle.plate}</p>
              <p className="mt-1 text-sm text-steel">{info.client.full_name}</p>
            </div>
          ) : (
            <p className="text-sm text-steel">Vehículo no encontrado</p>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-navy/10 bg-white p-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-display text-sm font-bold text-navy">Inspección Preliminar</p>
            {inspection && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-emerald-700">
                Vinculada
              </span>
            )}
          </div>

          {inspection ? (
            <p className="text-sm text-steel">
              {inspection.notes || "Sin notas."}
              {inspection.mileage ? ` ${inspection.mileage.toLocaleString("es-VE")} km.` : ""}
            </p>
          ) : (
            (() => {
              const candidates = unlinkedInspections.filter((i) => i.vehicle_id === order.vehicle_id);
              if (candidates.length === 0) {
                return <p className="text-sm text-steel">Sin inspección preliminar vinculada.</p>;
              }
              return (
                <div className="space-y-2">
                  <p className="text-sm text-steel">Hay inspecciones de este vehículo sin vincular:</p>
                  {candidates.map((c) => (
                    <button
                      key={c.id}
                      disabled={readOnly || saving}
                      onClick={() => { if (!readOnly) void link(c.id).then(() => refreshOrder()); }}
                      className="flex w-full items-center justify-between rounded-xl border border-navy/10 px-3 py-2 text-left text-sm transition hover:bg-ash"
                    >
                      <span className="text-steel">
                        {new Date(c.created_at).toLocaleString("es-VE")}
                      </span>
                      <span className="font-semibold text-blue">Vincular</span>
                    </button>
                  ))}
                </div>
              );
            })()
          )}
        </div>
        <div className="rounded-2xl border border-navy/10 bg-white p-5">
          <p className="font-display text-sm font-bold text-navy">Inspección Minuciosa</p>
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">El técnico aún no ha realizado la inspección minuciosa.</p>
        </div>
      </div>

      {readOnly && <p role="status" className="mt-6 rounded-xl bg-ash px-4 py-3 text-sm text-steel">
        Esta orden es de solo lectura.{(order.invoiced_at || order.status === "orden_cerrada") ? " El precio quedó congelado al facturar." : ""}
      </p>}
      {showPendingPlanBanner && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue/20 bg-blue-light px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-navy">
              Este vehículo tiene un servicio de plan pendiente:{" "}
              <span className="font-mono text-blue">{info?.vehicle.next_maintenance_tempario_code}</span>{" "}
              {info?.vehicle.next_maintenance_tempario_name}
            </p>
            <p className="mt-0.5 text-xs text-steel">
              Se cargará la tarea y los repuestos que incluye, sin tener que buscarla.
            </p>
          </div>
          <button
            onClick={addPlanTask}
            disabled={addingPlanTask}
            className="rounded-full bg-blue px-5 py-2 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-60"
          >
            Cargar del plan
          </button>
        </div>
      )}

      {summary && summary.warnings.length > 0 && (
        <div className="mt-6 space-y-2">
          {summary.warnings.map((warning, i) => (
            <div
              key={i}
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="flex-1">{warning}</p>
              <button
                onClick={dismissWarnings}
                aria-label="Cerrar advertencia"
                className="text-amber-700 hover:text-amber-900"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {filialId && (
        <div className="mt-6">
          <TasksCard
            readOnly={readOnly || saving}
            filialId={filialId}
            tasks={summary?.tasks ?? []}
            onAdd={addTask}
            onToggleStatus={toggleTaskStatus}
            onRemove={removeTask}
          />
        </div>
      )}

      {filialId && (
        <div className="mt-6 space-y-6">
          <TransfersCard
            readOnly={readOnly || saving}
            filialId={filialId}
            transfers={summary?.transfers ?? []}
            onAddLine={addTransferLine}
            onMarkOrdered={markOrdered}
          />
          {summary && <CoverageBreakdownCard summary={summary} filialId={filialId} readOnly={readOnly || saving} onChangeTaskPayer={changeTaskPayer} onChangeLinePayer={changeLinePayer} />}
          <div className="ml-auto w-full lg:max-w-lg">{summary && <PriceSummaryCard summary={summary} totalAmount={order.total_amount} onDiscountChange={changeDiscount} saving={saving} readOnly={readOnly} />}</div>
        </div>
      )}
      {billingOpen && <BillingModal orderId={orderId} orderCode={order.code} invoiced={!!order.invoiced_at}
        onClose={() => setBillingOpen(false)} onInvoiced={async () => { await refreshOrder(); await refreshSummary(); toast.success("Orden facturada."); }} />}
      {claimModalOpen && filialId && (
        <WarrantyClaimModal
          filialId={filialId}
          vehicleId={order.vehicle_id}
          serviceOrderId={orderId}
          onClose={() => setClaimModalOpen(false)}
        />
      )}
    </div>
  );
}