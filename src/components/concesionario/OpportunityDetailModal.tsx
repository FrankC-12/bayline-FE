"use client";
import { useEffect, useState } from "react";
import Modal from "@/components/common/Modal";
import SalesWorkflowPanel from "./SalesWorkflowPanel";
import OpportunityFrame from "./OpportunityFrame";
import { getClient } from "@/lib/api/clients";
import {
  listVehicles,
  reserveVehicle,
  updateVehicle,
} from "@/lib/api/concesionario";
import {
  getOpportunity,
  updateOpportunity,
  quoteOpportunity,
  deliverOpportunity,
  type Opportunity,
} from "@/lib/api/opportunities";
import type { Client } from "@/types/client";
import type { DealershipVehicle } from "@/types/concesionario";
import { useVehicleSalesAdvisors } from "@/hooks/useVehicleSalesAdvisors";
import { formatMoney, formatEntryDate } from "@/lib/format";
import { LEAD_ORIGINS } from "@/lib/leads";
import ReserveVehicleModal from "./ReserveVehicleModal";
import SellVehicleModal from "./SellVehicleModal";
export default function OpportunityDetailModal({
  initial,
  fullPage = false,
  filialId,
  canEdit,
  onClose,
  onChanged,
}: {
  initial: Opportunity;
  fullPage?: boolean;
  filialId: string;
  canEdit: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [opp, setOpp] = useState(initial);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [client, setClient] = useState<Client | null>(null);
  const [units, setUnits] = useState<DealershipVehicle[]>([]);
  const [unitId, setUnitId] = useState(initial.vehicle_id || "");
  const [discount, setDiscount] = useState(initial.discount_percentage || 0);
  const [saleType, setSaleType] = useState(initial.sale_type);
  const [advisor, setAdvisor] = useState(initial.advisor_user_id || "");
  const [notes, setNotes] = useState(initial.notes || "");
  const [next, setNext] = useState(initial.next_contact_at || "");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reserve, setReserve] = useState(false);
  const [sell, setSell] = useState(false);
  const [delivering, setDelivering] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const { users } = useVehicleSalesAdvisors(filialId);
  useEffect(() => {
    let active = true;
    Promise.all([
      getOpportunity(initial.id),
      listVehicles(filialId),
      initial.client_id ? getClient(initial.client_id) : Promise.resolve(null),
    ])
      .then(([latest, stock, person]) => {
        if (active) {
          setOpp(latest);
          setNotes(latest.notes || "");
          setAdvisor(latest.advisor_user_id || "");
          setNext(latest.next_contact_at || "");
          setUnitId(latest.vehicle_id || "");
          setSaleType(latest.sale_type);
          setUnits(stock);
          setClient(person);
        }
      })
      .catch((err) => {
        if (active)
          setError(
            err instanceof Error
              ? err.message
              : "No se pudo cargar la oportunidad.",
          );
      })
      .finally(() => {
        if (active) setLoadingDetails(false);
      });
    return () => {
      active = false;
    };
  }, [initial.id, initial.client_id, filialId]);
  const unit = units.find((item) => item.id === opp.vehicle_id) || null;
  const closed = !!opp.sale_id;
  const field =
    "mt-1.5 w-full rounded-xl border border-navy/15 bg-white px-3 py-2.5 text-sm";
  async function action(run: () => Promise<Opportunity>) {
    setBusy(true);
    setError(null);
    try {
      const data = await run();
      setOpp(data);
      setDelivering(false);
      onChanged();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo completar la acción.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function reload() {
    const [latest, stock] = await Promise.all([
      getOpportunity(opp.id),
      listVehicles(filialId),
    ]);
    setOpp(latest);
    setAdvisor(latest.advisor_user_id || "");
    setUnits(stock);
    onChanged();
  }
  if (loadingDetails)
    return (
      <Modal open onClose={onClose} title="Oportunidad">
        <p role="status" className="p-8 text-center text-sm text-steel">
          Cargando detalle…
        </p>
      </Modal>
    );
  const reservationDialog =
    reserve && unit ? (
      <ReserveVehicleModal
        open
        filialId={filialId}
        vehicle={unit}
        initialClient={client}
        quotedAmount={opp.quoted_amount}
        opportunityVersion={opp.workflow?.enabled ? opp.version : undefined}
        onClose={() => setReserve(false)}
        onConfirm={async (payload) => {
          if (payload.client_id !== opp.client_id)
            throw new Error("Selecciona el cliente de esta oportunidad.");
          await reserveVehicle(unit.id, payload);
          setReserve(false);
          await reload();
        }}
      />
    ) : null;
  const saleDialog =
    sell && unit ? (
      <SellVehicleModal
        open
        filialId={filialId}
        vehicle={unit}
        initialClient={client}
        quote={{
          id: opp.id,
          version: opp.version,
          amount: opp.quoted_amount,
          sale_type: opp.sale_type,
          depositAmount:
            opp.workflow?.deposit?.status === "registrado"
              ? opp.workflow.deposit.amount
              : 0,
          workflowEnabled: opp.workflow?.enabled,
        }}
        onClose={() => setSell(false)}
        onConfirm={async (sale) => {
          if (sale.client_id !== opp.client_id)
            throw new Error("Selecciona el cliente de esta oportunidad.");
          await updateVehicle(unit.id, { status: "vendido", sale });
          await reload();
        }}
      />
    ) : null;
  return (
    <OpportunityFrame
      opp={opp}
      fullPage={fullPage}
      onClose={onClose}
      closeDisabled={busy}
    >
      {reservationDialog}
      {saleDialog}
      <div className="space-y-5 p-5 sm:p-7">
        <SalesWorkflowPanel
          opp={opp}
          filialId={filialId}
          canEdit={canEdit}
          pausePolling={
            busy ||
            reserve ||
            sell ||
            delivering ||
            notes !== (opp.notes || "") ||
            advisor !== (opp.advisor_user_id || "") ||
            next !== (opp.next_contact_at || "")
          }
          onChange={(value) => {
            setOpp(value);
            onChanged();
          }}
        />
        <section className="rounded-2xl bg-slate-50 p-5">
          <p className="font-semibold text-navy">
            {opp.vehicle_label || "Sin unidad cotizada"}
          </p>
          <p className="mt-2 text-2xl font-bold text-blue">
            {opp.amount == null
              ? "Pendiente de cotizar"
              : `${opp.currency === "VES" ? "Bs." : "$"} ${formatMoney(opp.amount)}`}
          </p>
          <p className="mt-2 text-xs text-steel">
            {opp.client_document} · {opp.client_phone || "Sin teléfono"} ·{" "}
            {LEAD_ORIGINS[opp.origin] || opp.origin}
          </p>
          {opp.quoted_at && (
            <p className="mt-2 text-xs text-steel">
              Cotización: {formatEntryDate(opp.quoted_at)} ·{" "}
              {opp.sale_type === "financiado" ? "Financiado" : "Contado"}
            </p>
          )}
        </section>
        {canEdit &&
          !closed &&
          ["prospecto", "cotizada"].includes(opp.stage) &&
          opp.workflow?.deposit?.status !== "registrado" && (
            <section className="rounded-xl border border-navy/10 p-4">
              <h3 className="font-semibold text-navy">Cotizar unidad</h3>
              <select
                aria-label="Unidad a cotizar"
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                className={field}
              >
                <option value="">Selecciona una unidad…</option>
                {units
                  .filter((item) => item.status !== "vendido")
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.brand} {item.model} {item.year} · {item.sku}
                    </option>
                  ))}
              </select>
              <select
                aria-label="Tipo de venta"
                value={saleType}
                onChange={(e) => setSaleType(e.target.value)}
                className={field}
              >
                <option value="contado">Contado</option>
                <option value="financiado">Financiado</option>
              </select>
              <label className="mt-4 block text-xs text-steel">
                Descuento (%)
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className={field}
                />
              </label>
              <p className="mt-2 text-xs text-steel">
                El precio se toma del catálogo. El IGTF se calcula al confirmar
                la forma de pago de la venta.
              </p>
              <button
                disabled={busy || !unitId}
                onClick={() =>
                  void action(() =>
                    quoteOpportunity(opp.id, {
                      discount_percentage: discount,
                      expected_version: opp.version,
                      vehicle_id: unitId,
                      sale_type: saleType,
                    }),
                  )
                }
                className="mt-3 rounded-full bg-blue px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Guardar cotización
              </button>
            </section>
          )}
        {!closed && (
          <section className="space-y-3">
            <h3 className="font-semibold text-navy">Seguimiento</h3>
            <label className="block text-sm text-navy">
              Vendedor
              <select
                disabled={!canEdit}
                value={advisor}
                onChange={(e) => setAdvisor(e.target.value)}
                className={field}
              >
                <option value="">Sin asignar</option>
                {advisor && !users.some((user) => user.id === advisor) && (
                  <option value={advisor}>
                    {opp.advisor_name || "Responsable anterior"}
                  </option>
                )}
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-navy">
              Próximo contacto
              <input
                disabled={!canEdit}
                type="date"
                value={next}
                onChange={(e) => setNext(e.target.value)}
                className={field}
              />
            </label>
            <label className="block text-sm text-navy">
              Notas
              <textarea
                disabled={!canEdit}
                maxLength={3000}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={field}
              />
            </label>
            {canEdit && (
              <button
                disabled={busy}
                onClick={() =>
                  void action(() =>
                    updateOpportunity(opp.id, {
                      expected_version: opp.version,
                      advisor_user_id: advisor || null,
                      notes: notes || null,
                      next_contact_at: next || null,
                    }),
                  )
                }
                className="rounded-full border border-blue/20 px-4 py-2 text-sm font-semibold text-blue disabled:cursor-not-allowed disabled:opacity-40"
              >
                Guardar seguimiento
              </button>
            )}
          </section>
        )}
        {canEdit && !closed && opp.stage !== "perdida" && (
          <div className="flex flex-wrap gap-3">
            {unit && client && (
              <>
                <button
                  disabled={opp.workflow?.deposit?.status === "registrado"}
                  onClick={() => setReserve(true)}
                  className="rounded-full bg-blue px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Reservar unidad
                </button>
                <button
                  disabled={
                    !!opp.workflow?.enabled &&
                    opp.sale_type === "financiado" &&
                    !(
                      opp.workflow.financing_status === "aprobado" &&
                      opp.workflow.files.contrato &&
                      opp.workflow.files.poliza &&
                      opp.workflow.insurer &&
                      opp.workflow.policy_number
                    )
                  }
                  onClick={() => setSell(true)}
                  className="rounded-full border border-blue/20 px-4 py-2 text-sm font-semibold text-blue disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Vender / facturar
                </button>
              </>
            )}
            {!opp.workflow?.enabled &&
              opp.quoted_at &&
              opp.sale_type === "financiado" && (
                <button
                  disabled={busy}
                  onClick={() =>
                    void action(() =>
                      updateOpportunity(opp.id, {
                        expected_version: opp.version,
                        stage: "financiamiento",
                      }),
                    )
                  }
                  className="rounded-full border border-navy/15 px-4 py-2 text-sm text-navy"
                >
                  Gestionar financiamiento
                </button>
              )}
          </div>
        )}
        {opp.sale_id && (
          <div className="flex flex-wrap gap-3">
            <a
              href={`/api/v1/vehicle-sales/${opp.sale_id}/invoice/pdf`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-blue/20 px-4 py-2 text-sm font-semibold text-blue disabled:cursor-not-allowed disabled:opacity-40"
            >
              Ver factura
            </a>
            {canEdit && opp.stage !== "entregada" && (
              <button
                disabled={
                  !!opp.workflow?.enabled && !opp.workflow.delivery_ready
                }
                onClick={() => {
                  setDelivering(true);
                  setConfirmed(false);
                  setReason("");
                }}
                className="rounded-full bg-blue px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Registrar entrega
              </button>
            )}
          </div>
        )}
        {delivering && (
          <section className="rounded-xl bg-blue-light p-4">
            <label className="block text-sm text-navy">
              Constancia de entrega
              <input
                minLength={3}
                maxLength={500}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Nombre de quien recibe y referencia"
                className={field}
              />
            </label>
            <label className="mt-3 flex items-center gap-2 text-sm text-navy">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
              />
              Confirmo que el vehículo fue entregado al cliente
            </label>
            <button
              disabled={busy || !confirmed || reason.trim().length < 3}
              onClick={() =>
                void action(() => deliverOpportunity(opp.id, reason))
              }
              className="mt-3 rounded-full bg-blue px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Confirmar entrega
            </button>
          </section>
        )}
        {canEdit && !closed && (
          <section className="border-t border-navy/10 pt-4">
            {opp.stage === "perdida" ? (
              <>
                <p className="mb-3 text-sm text-steel">
                  Motivo: {opp.lost_reason}
                </p>
                <button
                  disabled={busy}
                  onClick={() =>
                    void action(() =>
                      updateOpportunity(opp.id, {
                        expected_version: opp.version,
                        stage: "prospecto",
                      }),
                    )
                  }
                  className="text-sm font-semibold text-blue"
                >
                  Reabrir oportunidad
                </button>
              </>
            ) : (
              <div>
                <label className="block text-sm text-steel">
                  Motivo de pérdida
                  <input
                    maxLength={1000}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className={field}
                  />
                </label>
                <button
                  disabled={busy || reason.trim().length < 3}
                  onClick={() =>
                    void action(() =>
                      updateOpportunity(opp.id, {
                        expected_version: opp.version,
                        stage: "perdida",
                        lost_reason: reason,
                      }),
                    )
                  }
                  className="mt-3 text-sm font-semibold text-red-600 disabled:opacity-40"
                >
                  Marcar como perdida
                </button>
              </div>
            )}
          </section>
        )}
        {opp.activity.length > 0 && (
          <section className="border-t border-navy/10 pt-4">
            <h3 className="mb-3 font-semibold text-navy">Actividad</h3>
            <ul className="space-y-2 text-xs text-steel">
              {opp.activity
                .slice()
                .reverse()
                .map((entry, index) => (
                  <li key={index} className="rounded-xl bg-slate-50 px-3 py-2">
                    <span className="font-semibold capitalize text-navy">
                      {entry.action}
                    </span>{" "}
                    · {formatEntryDate(entry.at)}
                    {entry.note && (
                      <p className="mt-1 break-words">{entry.note}</p>
                    )}
                  </li>
                ))}
            </ul>
          </section>
        )}
        {error && (
          <div
            role="alert"
            className="rounded-xl bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
            <button
              onClick={() => void reload().catch(() => {})}
              className="ml-2 underline"
            >
              Actualizar
            </button>
          </div>
        )}
      </div>
    </OpportunityFrame>
  );
}
