"use client";
import ErrorState from "@/components/common/ErrorState";
import { deleteServiceOrderTransfer } from "@/lib/api/serviceOrders";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ChevronLeft, Clock, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useServiceOrder } from "@/hooks/useServiceOrder";
import { useVehicleLookup } from "@/hooks/useVehicleLookUp";
import { useUserDirectory } from "@/hooks/useUserDirectory";
import { useRoleDirectory } from "@/hooks/useRoleDirectory";
import { useBays } from "@/hooks/useBays";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import { useInspectionForOrder } from "@/hooks/useInspectionForOrder";
import { useInspections } from "@/hooks/useInspections";
import { useOrderSummary } from "@/hooks/useOrderSummary";
import TasksCard from "./TaskCard";
import TransfersCard from "./TransferCard";
import InspectionReadout from "./InspectionReadout";
import InspectionRecordModal from "./InspectionRecordModal";
import DraftOrderEditor from "./DraftOrderEditor";
import OrderStages from "./OrderStages";
import { useDetailedInspection } from "@/hooks/useDetailedInspection";
import { useUpsellsContext } from "@/contexts/UpsellsContext";
import OrderFindings from "./OrderFindings";
import PriceSummaryCard from "./PriceSummaryCard";
import BillingModal from "./BillingModal";
import PendingUpsellsBlock from "./PendingUpsellsBlock";
import WarrantyClaimModal from "./WarrantyClaimModal";
import VehicleDamageMap from "@/components/inspections/VehicleDamageMap";
import { useOrderPaymentStatus } from "@/hooks/useOrderPaymentStatus";
import { closeServiceOrder } from "@/lib/api/serviceOrderBilling";
import { formatElapsed, serviceOrderStoppedAt } from "@/lib/time";
import LiveDot from "@/components/common/LiveDot";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import type { WarrantyClaimType } from "@/types/warrantyClaim";

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

interface OrderDetailProps {
  orderId: string;
}

export default function OrderDetail({ orderId }: OrderDetailProps) {
  const router = useRouter();
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;
  const toast = useToast();

  const {
    order,
    loading,
    error,
    update,
    cancel,
    reopen,
    forceComplete: forceCompleteOrder,
    refresh: refreshOrder,
  } = useServiceOrder(orderId);
  const { vehicleMap } = useVehicleLookup(filialId);
  const { users } = useUserDirectory({ filialId });
  const { roles } = useRoleDirectory("filial");
  const { bays } = useBays(filialId);
  const suggestedClaimType: WarrantyClaimType | undefined = undefined;
  const { canEdit: canReopen } = useModuleAccess("administracion");
  const detailed = useDetailedInspection(orderId);
  const payment = useOrderPaymentStatus(
    orderId,
    filialId,
    !!order?.invoiced_at,
  );
  const { upsells } = useUpsellsContext();
  const {
    inspection,
    link,
    loading: preliminaryLoading,
    error: preliminaryError,
    refresh: refreshPreliminary,
  } = useInspectionForOrder(order?.id ?? null);
  const { inspections: unlinkedInspections } = useInspections(filialId, true);
  const {
    summary,
    error: summaryError,
    refresh: refreshSummary,
    addTask,
    removeTask,
    addTransferLine,
    changeLineQuantity,
    removeLine,
    markOrdered,
    dismissWarnings,
  } = useOrderSummary(order?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [billingOpen, setBillingOpen] = useState(false);
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const closing = useRef(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [forceCompleteDialogOpen, setForceCompleteDialogOpen] = useState(false);
  const [addingPlanTask, setAddingPlanTask] = useState(false);
  const stoppedAt = order ? serviceOrderStoppedAt(order) : null;
  const [elapsed, setElapsed] = useState(() =>
    order ? formatElapsed(order.created_at, stoppedAt) : "",
  );
  const [inspectionRecord, setInspectionRecord] = useState<
    "preliminary" | "detailed" | null
  >(null);
  const [damageMapOpen, setDamageMapOpen] = useState(false);

  useEffect(() => {
    if (!order) return;
    if (stoppedAt) {
      setElapsed(formatElapsed(order.created_at, stoppedAt));
      return;
    }
    setElapsed(formatElapsed(order.created_at));
    const interval = setInterval(
      () => setElapsed(formatElapsed(order.created_at)),
      1000,
    );
    return () => clearInterval(interval);
  }, [order, stoppedAt]);

  const technicianRoleId = roles.find((r) => r.slug === "tecnico")?.id;
  const technicians = users.filter((u) => u.role_id === technicianRoleId);

  if (loading) {
    return (
      <div className="p-12 text-center text-sm text-steel">
        Cargando orden...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
        <h1 className="mt-4 font-display text-xl font-bold text-navy">
          No se pudo cargar la orden
        </h1>
        <p className="mt-2 text-sm text-steel">
          La orden de servicio no existe, fue eliminada, o el enlace es
          inválido.
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

  const info = vehicleMap.get(order.vehicle_id ?? "");
  const orderPayer: import("@/types/serviceOrder").ServiceOrderPayer = [
    "retrabajo",
    "comeback",
  ].includes(order.order_type.code)
    ? (summary?.tasks.find((t) => t.payer !== "cliente")?.payer ??
      "garantia_taller")
    : ["garantia_fabrica", "campana"].includes(order.order_type.code)
      ? "garantia_fabrica"
      : "cliente";
  const readOnly =
    !!order.invoiced_at ||
    order.status === "orden_cerrada" ||
    order.status === "cancelado";

  // El estado pendiente/en progreso/completado se calcula solo según las
  // tareas (y ODTs) de la orden — forzar completado es la única excepción
  // manual, para cuando algo queda pendiente a propósito.
  const pendingTaskNames = (summary?.tasks ?? [])
    .filter((t) => t.status !== "completada" && t.status !== "cancelada")
    .map((t) => t.name_snapshot);
  const pendingTransferCodes = (summary?.transfers ?? [])
    .filter((t) => t.status === "pendiente")
    .map((t) => t.code);
  const hasPendingWork =
    pendingTaskNames.length > 0 || pendingTransferCodes.length > 0;
  const canForceComplete =
    !readOnly &&
    (order.status === "pendiente" || order.status === "en_progreso") &&
    hasPendingWork;
  const pendingWorkMessage = [
    pendingTaskNames.length > 0
      ? `${pendingTaskNames.length} ${pendingTaskNames.length === 1 ? "tarea" : "tareas"} sin terminar (${pendingTaskNames.join(", ")})`
      : null,
    pendingTransferCodes.length > 0
      ? `${pendingTransferCodes.length} ${pendingTransferCodes.length === 1 ? "ODT" : "ODTs"} sin despachar (${pendingTransferCodes.join(", ")})`
      : null,
  ]
    .filter(Boolean)
    .join(" y ");

  const pendingPlanTemparioId =
    info?.vehicle.next_maintenance_tempario_id ?? null;
  const pendingPlanAlreadyAdded = !!(
    pendingPlanTemparioId &&
    summary?.tasks.some((t) => t.tempario_id === pendingPlanTemparioId)
  );
  const showPendingPlanBanner =
    !readOnly && !!pendingPlanTemparioId && !pendingPlanAlreadyAdded;

  async function addPlanTask() {
    if (!pendingPlanTemparioId) return;
    setAddingPlanTask(true);
    setActionError(null);
    try {
      await addTask(pendingPlanTemparioId, orderPayer);
      await refreshOrder();
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar la tarea del plan.",
      );
    } finally {
      setAddingPlanTask(false);
    }
  }

  async function finishOrder() {
    if (!order?.invoiced_at || order.status !== "completado" || closing.current)
      return;
    closing.current = true;
    setSaving(true);
    setActionError(null);
    try {
      await closeServiceOrder(orderId);
      await refreshOrder();
      await refreshSummary();
      toast.success("Entrega registrada. Orden cerrada.");
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "No se pudo cerrar la orden.",
      );
    } finally {
      closing.current = false;
      setSaving(false);
    }
  }

  async function forceComplete() {
    if (readOnly) return;
    setSaving(true);
    try {
      await forceCompleteOrder();
      await refreshSummary();
      toast.success("Orden marcada como completada.");
      setForceCompleteDialogOpen(false);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "No se pudo completar la orden.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function confirmCancel() {
    if (cancelReason.trim().length < 3) return;
    setSaving(true);
    setActionError(null);
    try {
      await cancel(cancelReason.trim());
      await refreshSummary();
      toast.success("Orden cancelada.");
      setCancelDialogOpen(false);
      setCancelReason("");
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "No se pudo cancelar la orden.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function reopenOrder() {
    setSaving(true);
    setActionError(null);
    try {
      await reopen();
      await refreshSummary();
      toast.success("Orden reabierta.");
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "No se pudo reabrir la orden.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function changeDiscount(
    discount_label: import("@/lib/partsPricing").DiscountLabel,
  ) {
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
    setActionError(null);
    try {
      await update(
        value === ""
          ? { clear_technician: true }
          : { technician_user_id: value },
      );
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar técnico.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function assignBay(value: string) {
    if (readOnly) return;
    setSaving(true);
    setActionError(null);
    try {
      await update(value === "" ? { clear_bay: true } : { bay_id: value });
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "No se pudo actualizar bahía.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (order.is_draft)
    return (
      <DraftOrderEditor
        key={order.id}
        order={order}
        onSubmitted={async () => {
          await refreshOrder();
          await refreshSummary();
        }}
      />
    );

  return (
    <div className="min-w-0">
      <InspectionRecordModal
        kind={inspectionRecord}
        loading={
          inspectionRecord === "preliminary"
            ? preliminaryLoading
            : detailed.loading
        }
        error={
          inspectionRecord === "preliminary"
            ? preliminaryError?.message
            : detailed.error
        }
        onRetry={() => {
          void (inspectionRecord === "preliminary"
            ? refreshPreliminary()
            : detailed.refresh());
        }}
        onClose={() => setInspectionRecord(null)}
        preliminary={inspection}
        detailed={detailed.inspection}
        inspector={
          users.find((u) => u.id === inspection?.inspector_user_id)
            ?.full_name ?? "Sin registrar"
        }
        technician={
          users.find(
            (u) =>
              u.id ===
              (detailed.inspection?.completed_by_user_id ??
                order.technician_user_id),
          )?.full_name ?? "Sin asignar"
        }
      />
      <button
        onClick={() => router.push("/dashboard/servicios")}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-steel hover:text-navy"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver a Órdenes de Servicio
      </button>

      <div className="relative rounded-2xl border border-navy/10 bg-white p-5">
        <div className="flex flex-wrap items-center gap-2 pr-8">
          <span className="font-mono text-lg font-bold text-blue">
            {order.code}
          </span>
          <span
            className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest ${STATUS_STYLES[order.status]}`}
          >
            {STATUS_LABELS[order.status]}
          </span>
          <span className="rounded-full bg-ash px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-steel">
            {order.order_type.name} ·{" "}
            {orderPayer === "cliente"
              ? "Cliente"
              : orderPayer === "garantia_taller"
                ? "Taller"
                : orderPayer === "garantia_fabrica"
                  ? "Marca"
                  : orderPayer === "proveedor"
                    ? "Proveedor"
                    : "Plan"}
          </span>
          {order.completed_with_pending_items && (
            <span
              title={
                order.completed_override_at
                  ? `Confirmado por ${users.find((u) => u.id === order.completed_override_by_user_id)?.full_name ?? "—"} el ${new Date(order.completed_override_at).toLocaleString("es-VE")}`
                  : undefined
              }
              className="rounded-full bg-amber-100 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-amber-700"
            >
              Completada con pendientes
            </span>
          )}
          <span className="flex items-center gap-1.5 rounded-full border border-navy/15 px-2.5 py-1 font-mono text-xs text-navy">
            {!stoppedAt && <LiveDot />}
            <Clock className="h-3.5 w-3.5" />
            {elapsed}
          </span>
        </div>

        <h1 className="mt-3 font-display text-2xl font-bold text-navy">
          {info
            ? `${info.vehicle.brand} ${info.vehicle.model} ${info.vehicle.year ?? ""}`
            : "Vehículo"}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-3 text-xs text-steel">
          <span className="rounded-lg border border-navy/10 px-2 py-1 font-mono text-navy">
            {info?.vehicle.plate || "Sin placa"}
          </span>
          <span>{info?.client.full_name ?? "—"}</span>
          <label className="flex items-center gap-2 sm:ml-auto">
            Técnico
            <select
              aria-label="Técnico asignado"
              disabled={readOnly || saving}
              value={order.technician_user_id ?? ""}
              onChange={(e) => void assignTechnician(e.target.value)}
              className="max-w-[180px] rounded-lg border border-navy/15 bg-white px-2 py-1 text-xs text-navy"
            >
              <option value="">Sin asignar</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2">
            Bahía
            <select
              aria-label="Bahía a utilizar"
              disabled={readOnly || saving}
              value={order.bay_id ?? ""}
              onChange={(e) => void assignBay(e.target.value)}
              className="max-w-[140px] rounded-lg border border-navy/15 bg-white px-2 py-1 text-xs text-navy"
            >
              <option value="">Sin asignar</option>
              {bays.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <OrderStages
          cancelled={order.status === "cancelado"}
          complete={[
            !!inspection,
            !!summary?.tasks.length,
            !!inspection &&
              !!summary &&
              summary.transfers.every((t) => !!t.picked_up_at),
            detailed.inspection?.status === "completada",
            !!summary?.tasks.length &&
              summary.tasks.every(
                (t) => t.status === "completada" || t.status === "cancelada",
              ),
            !!order.invoiced_at && payment.settled,
            order.status === "orden_cerrada",
          ]}
        />

        {(order.status === "completado" ||
          order.status === "orden_cerrada") && (
          <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
            {order.status === "completado" && (
              <>
                <button
                  onClick={() => setBillingOpen(true)}
                  disabled={saving}
                  className="rounded-full bg-blue px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {order.invoiced_at ? "Ver factura y cobro" : "Facturar"}
                </button>
                <button
                  onClick={() => void finishOrder()}
                  disabled={saving || !order.invoiced_at}
                  title={
                    !order.invoiced_at
                      ? "Primero debes facturar y registrar el cobro"
                      : undefined
                  }
                  className="rounded-full bg-navy px-5 py-2 text-sm font-semibold text-white disabled:opacity-40"
                >
                  Registrar entrega
                </button>
              </>
            )}
            {order.status === "orden_cerrada" && order.invoiced_at && (
              <button
                onClick={() => setBillingOpen(true)}
                className="rounded-full border border-blue px-5 py-2 text-sm font-semibold text-blue"
              >
                Ver factura y cobro
              </button>
            )}
          </div>
        )}
        <details className="group absolute right-4 top-4 z-10">
          <summary
            aria-label="Más acciones de la orden"
            className="ml-auto w-fit cursor-pointer list-none rounded-full border border-navy/15 px-3 py-1 text-sm text-steel"
          >
            •••
          </summary>
          <div className="absolute right-0 mt-2 w-72 rounded-xl border border-navy/10 bg-white p-3 shadow-lg">
            {(canForceComplete ||
              order.status === "completado" ||
              !!order.invoiced_at ||
              !!actionError) && (
              <div className="mt-5 flex flex-wrap gap-3 border-t border-navy/10 pt-5">
                {canForceComplete && (
                  <button
                    onClick={() => setForceCompleteDialogOpen(true)}
                    disabled={saving}
                    title="Completa la orden aunque queden tareas u ODTs pendientes"
                    className="rounded-full border border-navy/15 px-5 py-2 text-sm font-semibold text-navy transition hover:border-blue hover:text-blue disabled:opacity-60"
                  >
                    Forzar completado
                  </button>
                )}
                {order.invoiced_at && (
                  <button
                    onClick={() => setClaimModalOpen(true)}
                    className="rounded-full border border-navy/15 px-5 py-2 text-sm font-semibold text-navy transition hover:border-blue hover:text-blue"
                  >
                    Reclamos de garantía
                  </button>
                )}
              </div>
            )}

            {(order.status === "pendiente" ||
              order.status === "en_progreso") && (
              <div className="mt-3 flex justify-end pt-1">
                <button
                  onClick={() => setCancelDialogOpen(true)}
                  disabled={saving || readOnly}
                  className="rounded-full px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                >
                  Cancelar orden
                </button>
              </div>
            )}

            {order.status === "cancelado" && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-red-100 pt-3">
                <div className="text-sm text-steel">
                  <p>
                    Cancelada por{" "}
                    <span className="font-semibold text-navy">
                      {users.find((u) => u.id === order.cancelled_by_user_id)
                        ?.full_name ?? "—"}
                    </span>{" "}
                    el{" "}
                    <span className="font-semibold text-navy">
                      {order.cancelled_at
                        ? new Date(order.cancelled_at).toLocaleString("es-VE")
                        : "—"}
                    </span>
                    {order.cancel_reason && (
                      <> — &ldquo;{order.cancel_reason}&rdquo;</>
                    )}
                  </p>
                  {order.reopened_at && (
                    <p className="mt-1">
                      Reabierta por{" "}
                      <span className="font-semibold text-navy">
                        {users.find((u) => u.id === order.reopened_by_user_id)
                          ?.full_name ?? "—"}
                      </span>{" "}
                      el{" "}
                      <span className="font-semibold text-navy">
                        {new Date(order.reopened_at).toLocaleString("es-VE")}
                      </span>
                    </p>
                  )}
                </div>
                {canReopen && (
                  <button
                    onClick={reopenOrder}
                    disabled={saving}
                    className="rounded-full border border-navy/15 px-5 py-2 text-sm font-semibold text-navy transition hover:border-blue hover:text-blue disabled:opacity-60"
                  >
                    Reabrir orden
                  </button>
                )}
              </div>
            )}
          </div>
        </details>
        {actionError && (
          <p
            role="alert"
            className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700"
          >
            {actionError}
          </p>
        )}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-navy/10 bg-white p-5">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              disabled={!inspection}
              onClick={() => {
                setInspectionRecord("preliminary");
                void refreshPreliminary();
              }}
              className="text-left font-display text-sm font-bold text-navy enabled:underline enabled:decoration-blue/30 enabled:underline-offset-4"
            >
              Inspección preliminar ↗
            </button>
            {inspection && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-emerald-700">
                Lista
              </span>
            )}
          </div>

          {inspection ? (
            <>
              <dl className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between gap-3">
                  <dt className="shrink-0 text-steel">Motivo del cliente</dt>
                  <dd className="text-right font-semibold text-navy">
                    {order.customer_reason ||
                      inspection.notes ||
                      "Sin registrar"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-steel">Daños</dt>
                  <dd className="font-semibold text-navy">
                    {inspection.damages.length} registrados
                  </dd>
                </div>
              </dl>
              {inspection.damages.length > 0 && (
                <button
                  onClick={() => setDamageMapOpen(true)}
                  className="mt-2 inline-flex items-center rounded-full border border-navy/15 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-steel transition hover:border-blue hover:text-blue"
                >
                  {inspection.damages.length} daño
                  {inspection.damages.length === 1 ? "" : "s"} registrado
                  {inspection.damages.length === 1 ? "" : "s"}
                </button>
              )}
            </>
          ) : (
            (() => {
              const candidates = unlinkedInspections.filter(
                (i) => i.vehicle_id === order.vehicle_id,
              );
              if (candidates.length === 0) {
                return (
                  <p className="text-sm text-steel">
                    Sin inspección preliminar vinculada.
                  </p>
                );
              }
              return (
                <div className="space-y-2">
                  <p className="text-sm text-steel">
                    Hay inspecciones de este vehículo sin vincular:
                  </p>
                  {candidates.map((c) => (
                    <button
                      key={c.id}
                      disabled={readOnly || saving}
                      onClick={() => {
                        if (!readOnly)
                          void link(c.id).then(() => refreshOrder());
                      }}
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
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              disabled={!detailed.inspection}
              onClick={() => {
                setInspectionRecord("detailed");
                void detailed.refresh();
              }}
              className="text-left font-display text-sm font-bold text-navy enabled:underline enabled:decoration-blue/30 enabled:underline-offset-4"
            >
              Inspección minuciosa ↗
            </button>
            <span
              className={`rounded-full px-2 py-1 text-[10px] font-semibold ${detailed.inspection?.status === "completada" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-steel"}`}
            >
              {detailed.loading
                ? "Cargando…"
                : detailed.inspection?.status === "completada"
                  ? "Lista"
                  : detailed.inspection
                    ? "En proceso"
                    : "Pendiente"}
            </span>
          </div>
          {detailed.error ? (
            <p role="alert" className="mt-3 text-xs text-red-700">
              {detailed.error}
              <button
                onClick={() => void detailed.refresh()}
                className="ml-2 font-semibold underline"
              >
                Reintentar
              </button>
            </p>
          ) : (
            <>
              <dl className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between gap-3">
                  <dt className="text-steel">Técnico</dt>
                  <dd className="font-semibold text-navy">
                    {users.find(
                      (u) =>
                        u.id ===
                        (detailed.inspection?.completed_by_user_id ??
                          order.technician_user_id),
                    )?.full_name ?? "Sin asignar"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-steel">Hallazgos</dt>
                  <dd className="font-semibold text-navy">
                    {
                      upsells.filter((u) => u.service_order_id === orderId)
                        .length
                    }
                  </dd>
                </div>
              </dl>
              {detailed.inspection ? (
                <details className="mt-3 text-xs text-steel">
                  <summary className="cursor-pointer font-semibold text-blue">
                    Ver revisión · {detailed.inspection.completed_steps}/
                    {detailed.inspection.total_steps}
                  </summary>
                  <InspectionReadout inspection={detailed.inspection} />
                </details>
              ) : (
                <p className="mt-3 text-xs text-steel">
                  El técnico registra la revisión desde la app.
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {readOnly && (
        <p
          role="status"
          className="mt-6 rounded-xl bg-ash px-4 py-3 text-sm text-steel"
        >
          Esta orden es de solo lectura.
          {order.invoiced_at || order.status === "orden_cerrada"
            ? " El precio quedó congelado al facturar."
            : ""}
        </p>
      )}
      {showPendingPlanBanner && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue/20 bg-blue-light px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-navy">
              Este vehículo tiene un servicio de plan pendiente:{" "}
              <span className="font-mono text-blue">
                {info?.vehicle.next_maintenance_tempario_code}
              </span>{" "}
              {info?.vehicle.next_maintenance_tempario_name}
            </p>
            <p className="mt-0.5 text-xs text-steel">
              Se cargará la tarea y los repuestos que incluye, sin tener que
              buscarla.
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

      {summaryError && (
        <ErrorState error={summaryError} onRetry={refreshSummary} />
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

      <div className="mt-4 grid items-start gap-4 xl:grid-cols-2">
        {filialId && (
          <div id="ods-trabajo" className="min-w-0 scroll-mt-6 space-y-3">
            <TasksCard
              readOnly={readOnly || saving}
              filialId={filialId}
              orderId={orderId}
              tasks={summary?.tasks ?? []}
              onAdd={async (id, _payer, expectedTotal) => {
                await addTask(id, orderPayer, expectedTotal);
                await refreshOrder();
              }}
              onRemove={async (...args) => {
                await removeTask(...args);
                await refreshOrder();
              }}
            >
              <OrderFindings
                orderId={orderId}
                readOnly={readOnly || saving}
                onApplied={async () => {
                  await refreshOrder();
                  await refreshSummary();
                }}
              />
              <PendingUpsellsBlock
                vehicleId={order.vehicle_id ?? ""}
                orderId={orderId}
                readOnly={readOnly || saving}
                onApplied={async () => {
                  await Promise.all([refreshOrder(), refreshSummary()]);
                }}
              />
            </TasksCard>
          </div>
        )}

        {filialId && (
          <div id="ods-repuestos" className="min-w-0 space-y-4 scroll-mt-6">
            <TransfersCard
              readOnly={readOnly || saving}
              filialId={filialId}
              transfers={summary?.transfers ?? []}
              onAddLine={(id, quantity) =>
                addTransferLine(id, quantity, orderPayer)
              }
              onChangeQuantity={changeLineQuantity}
              onRemoveLine={removeLine}
              onMarkOrdered={markOrdered}
              onDeleteTransfer={async (id) => {
                await deleteServiceOrderTransfer(id);
                await refreshSummary();
                await refreshOrder();
                window.dispatchEvent(new Event("bayline:workshop-updated"));
              }}
            />
          </div>
        )}
      </div>
      <div id="ods-resumen" className="mt-4 scroll-mt-6">
        {summary && (
          <PriceSummaryCard
            summary={summary}
            totalAmount={order.total_amount}
            onDiscountChange={changeDiscount}
            saving={saving}
            readOnly={readOnly}
          />
        )}
      </div>
      {billingOpen && (
        <BillingModal
          orderId={orderId}
          orderCode={order.code}
          invoiced={!!order.invoiced_at}
          onClose={() => setBillingOpen(false)}
          onInvoiced={async () => {
            await refreshOrder();
            await refreshSummary();
            await payment.refresh();
            toast.success("Orden facturada.");
          }}
        />
      )}
      {claimModalOpen && filialId && (
        <WarrantyClaimModal
          filialId={filialId}
          vehicleId={order.vehicle_id ?? ""}
          serviceOrderId={orderId}
          onClose={() => setClaimModalOpen(false)}
          initialClaimType={suggestedClaimType}
        />
      )}
      {damageMapOpen && inspection && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setDamageMapOpen(false)}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="font-display text-lg font-bold text-navy">
                Daños registrados
              </p>
              <button
                onClick={() => setDamageMapOpen(false)}
                aria-label="Cerrar"
                className="rounded-lg p-2 text-steel hover:bg-ash hover:text-navy"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <VehicleDamageMap damages={inspection.damages} editable={false} />
            {inspection.photo_urls.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-steel">
                  Fotos generales
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {inspection.photo_urls.map((url) => (
                    <a key={url} href={url} target="_blank" rel="noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt=""
                        className="aspect-square w-full rounded-lg object-cover"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <ConfirmDialog
        open={cancelDialogOpen}
        title="Cancelar orden"
        description={`Esta acción cancelará la orden ${order.code}. Quedará registrado quién y cuándo la canceló, y podrá reabrirse después si corresponde.`}
        confirmLabel="Cancelar orden"
        cancelLabel="Volver"
        confirming={saving}
        reason={{
          label: "Motivo de la cancelación",
          placeholder: "Ej. El cliente desistió del servicio.",
          value: cancelReason,
          onChange: setCancelReason,
          minLength: 3,
        }}
        onConfirm={confirmCancel}
        onCancel={() => {
          setCancelDialogOpen(false);
          setCancelReason("");
        }}
      />
      <ConfirmDialog
        open={forceCompleteDialogOpen}
        title="Completar orden con pendientes"
        description={`Pendiente: ${pendingWorkMessage}. ¿Completar la orden de todas formas? Quedará registrado quién lo confirmó y cuándo.`}
        confirmLabel="Completar de todas formas"
        cancelLabel="Volver"
        confirming={saving}
        onConfirm={forceComplete}
        onCancel={() => setForceCompleteDialogOpen(false)}
      />
    </div>
  );
}
