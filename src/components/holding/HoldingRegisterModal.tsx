"use client";
import { useEffect, useRef, useState } from "react";
import Modal from "@/components/common/Modal";
import {
  getHoldingControl,
  registerHolding,
  type Row,
  type Section,
} from "@/lib/api/holdingControl";
import { formatMoneyInput } from "@/lib/format";
import { NumberInput } from "@/components/ui/NumberInput";
import { localToday } from "@/lib/holdingControlFormat";
const kinds: Record<string, string> = {
  risk_policy: "Límites de riesgo del holding",
  target: "Meta diaria de ventas",
  opportunity: "Oportunidad comercial",
  cash_count: "Arqueo de caja",
  funds_transfer: "Transferencia entre filiales",
  tax: "Obligación fiscal",
  tax_payment: "Pago de obligación fiscal",
  vehicle_delivery: "Registrar entrega de vehículo vendido",
  stock_transfer: "Solicitar traslado de repuestos",
  stock_transfer_action: "Aprobar / despachar / recibir traslado",
  journal: "Asiento contable / eliminación",
};
const choices: Record<string, string[]> = {
  inventario: ["stock_transfer", "stock_transfer_action", "vehicle_delivery"],
  actividad: ["risk_policy"],
  comercial: ["target", "opportunity"],
  tesoreria: ["funds_transfer", "tax", "tax_payment"],
  contabilidad: ["journal", "tax"],
};
const inputClass =
  "mt-1 block w-full rounded-xl border border-navy/15 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-blue focus:ring-2 focus:ring-blue/10";
export default function HoldingRegisterModal({
  holdingId,
  section,
  filiales,
  onClose,
  onSaved,
}: {
  holdingId: string;
  section: Section;
  filiales: { id: string; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [kind, setKind] = useState((choices[section] ?? [])[0] ?? "target");
  const [day, setDay] = useState(localToday);
  const [fields, setFields] = useState<Record<string, string>>({
    filial_id: filiales[0]?.id ?? "",
    stage: "contacto",
    currency: "usd",
  });
  const [warehouses, setWarehouses] = useState<Row[]>([]);
  const [vehicles, setVehicles] = useState<Row[]>([]);
  const [parts, setParts] = useState<Row[]>([]);
  const [transfers, setTransfers] = useState<Row[]>([]);
  const [accounts, setAccounts] = useState<Row[]>([]);
  const [taxes, setTaxes] = useState<Row[]>([]);
  const [opportunities, setOpportunities] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [elimination, setElimination] = useState(false);
  const [lines, setLines] = useState([
    { account: "", category: "asset", debit: "", credit: "" },
    { account: "", category: "equity", debit: "", credit: "" },
  ]);
  const pending = useRef(false);
  // One request id per exact payload: a retry after a lost response cannot duplicate money movements.
  const attempt = useRef<{ hash: string; id: string } | null>(null);
  const set = (key: string, v: string) =>
    setFields((old) => ({ ...old, [key]: v }));
  useEffect(() => {
    let active = true;
    setLoading(true);
    const day = localToday();
    void Promise.all([
      getHoldingControl(holdingId, "tesoreria", day, day),
      section === "comercial"
        ? getHoldingControl(holdingId, "comercial", day, day)
        : Promise.resolve(null),
      section === "inventario"
        ? getHoldingControl(holdingId, "inventario", day, day)
        : Promise.resolve(null),
    ])
      .then(([treasury, commercial, inventory]) => {
        if (!active) return;
        setVehicles(
          inventory?.tables.find((t) => t.title === "Vehículos por sucursal")
            ?.rows ?? [],
        );
        setWarehouses(
          inventory?.tables.find((t) => t.title === "Almacenes del grupo")
            ?.rows ?? [],
        );
        setParts(
          inventory?.tables.find(
            (t) => t.title === "Existencias cruzadas entre sucursales",
          )?.rows ?? [],
        );
        setTransfers(
          inventory?.tables.find((t) => t.title === "Traslados entre filiales")
            ?.rows ?? [],
        );
        setAccounts(
          treasury.tables.find((t) => t.title === "Cuentas y disponibilidad")
            ?.rows ?? [],
        );
        setTaxes(
          treasury.tables
            .find((t) => t.title === "Calendario global de pagos")
            ?.rows.filter((r) => r.document === "Fiscal") ?? [],
        );
        setOpportunities(
          commercial?.tables.find((t) => t.title === "Embudo comercial")
            ?.rows ?? [],
        );
      })
      .catch((e) => {
        if (active)
          setError(
            e instanceof Error
              ? e.message
              : "No se pudieron cargar las cuentas.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [holdingId, section]);
  const field = (
    key: string,
    label: string,
    type = "text",
    required = true,
  ) => (
    <label className="block text-sm font-medium text-navy" key={key}>
      {label}
      {["amount", "counted", "quantity"].includes(key) ? (
        <NumberInput
          required={required}
          min={key === "quantity" ? 1 : 0}
          step={key === "quantity" ? 1 : "0.01"}
          value={fields[key] ?? ""}
          onValueChange={(v) => set(key, v)}
          className={inputClass}
        />
      ) : (
        <input
          required={required}
          maxLength={key === "description" ? 300 : 150}
          type={type}
          value={fields[key] ?? ""}
          onChange={(e) => set(key, e.target.value)}
          className={inputClass}
        />
      )}
    </label>
  );
  const select = (
    key: string,
    label: string,
    options: { id: string; name: string }[],
    required = true,
  ) => (
    <label className="block text-sm font-medium text-navy" key={key}>
      {label}
      <select
        required={required}
        value={fields[key] ?? ""}
        onChange={(e) => set(key, e.target.value)}
        className={inputClass}
      >
        <option value="">Seleccionar…</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    </label>
  );
  const ownAccounts = accounts
    .filter(
      (a) =>
        a.status === "activa" &&
        a.filial_id === fields.filial_id &&
        (kind !== "cash_count" || a.account_type === "caja"),
    )
    .map((a) => ({
      id: String(a.id),
      name: `${a.name} · ${String(a.currency).toUpperCase()}`,
    }));
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      const money = (v: string) => String(Number((v || "0").replace(",", ".")));
      let record: Record<string, unknown> = {
        kind,
        filial_id: fields.filial_id,
      };
      if (kind === "target") record.amount = money(fields.amount);
      if (kind === "cash_count")
        Object.assign(record, {
          account_id: fields.account_id,
          counted: money(fields.counted),
          note: fields.note ?? "",
        });
      if (kind === "tax")
        Object.assign(record, {
          name: fields.name,
          currency: fields.currency,
          amount: money(fields.amount),
          due_date: fields.due_date,
        });
      if (kind === "tax_payment")
        Object.assign(record, {
          obligation_id: fields.obligation_id,
          account_id: fields.account_id,
          amount: money(fields.amount),
          reference: fields.reference,
        });
      if (kind === "funds_transfer")
        record = {
          kind,
          source_account_id: fields.source_account_id,
          destination_account_id: fields.destination_account_id,
          amount: money(fields.amount),
          reference: fields.reference,
        };
      if (kind === "opportunity")
        Object.assign(record, {
          client: fields.client,
          description: fields.description,
          amount: money(fields.amount),
          stage: fields.stage,
          ...(fields.opportunity_id
            ? { opportunity_id: fields.opportunity_id }
            : {}),
        });
      if (kind === "stock_transfer")
        record = {
          kind,
          source_warehouse_id: fields.source_warehouse_id,
          destination_warehouse_id: fields.destination_warehouse_id,
          note: fields.note,
          lines: [
            {
              source_part_id: fields.source_part_id,
              destination_part_id: fields.destination_part_id,
              quantity: Number(fields.quantity),
            },
          ],
        };
      if (kind === "stock_transfer_action")
        record = {
          kind,
          transfer_id: fields.transfer_id,
          action: fields.action,
          note: fields.note,
        };
      if (kind === "risk_policy")
        record = {
          kind,
          max_discount_percentage: fields.max_discount_percentage
            ? Number(fields.max_discount_percentage)
            : null,
          workshop_warning_hours: Number(fields.workshop_warning_hours || 48),
        };
      if (kind === "vehicle_delivery")
        Object.assign(record, {
          vehicle_id: fields.vehicle_id,
          note: fields.note,
        });
      if (kind === "journal")
        record = {
          kind,
          filial_id: elimination ? null : fields.filial_id,
          description: fields.description,
          elimination,
          lines: lines.map((l) => ({
            ...l,
            debit: money(l.debit),
            credit: money(l.credit),
          })),
        };
      const hash = JSON.stringify({ entry_date: day, record });
      if (attempt.current?.hash !== hash)
        attempt.current = { hash, id: crypto.randomUUID() };
      await registerHolding(holdingId, {
        request_id: attempt.current.id,
        entry_date: day,
        record,
      });
      onSaved();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo guardar el registro.",
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return (
    <Modal
      open
      title="Registrar operación del holding"
      description="La operación quedará registrada con tu usuario y su fecha."
      size={kind === "journal" ? "lg" : "md"}
      onClose={onClose}
      closeDisabled={busy}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-full border border-navy/15 px-5 py-2.5 text-sm font-semibold"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="holding-register"
            disabled={busy || loading}
            className="rounded-full bg-blue px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Guardando…" : "Guardar registro"}
          </button>
        </>
      }
    >
      <form id="holding-register" onSubmit={submit} className="space-y-4 p-6">
        <label className="block text-sm font-medium">
          Operación
          <select
            value={kind}
            disabled={busy}
            onChange={(e) => {
              setKind(e.target.value);
              setError("");
            }}
            className={inputClass}
          >
            {(choices[section] ?? []).map((k) => (
              <option key={k} value={k}>
                {kinds[k]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium">
          Fecha
          <input
            required
            type="date"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className={inputClass}
          />
        </label>
        {![
          "risk_policy",
          "funds_transfer",
          "stock_transfer",
          "stock_transfer_action",
        ].includes(kind) &&
          !(kind === "journal" && elimination) &&
          select("filial_id", "Filial", filiales)}
        {kind === "target" && (
          <>
            {field("amount", "Meta de ventas netas (USD)")}
            <p className="text-xs text-steel">
              Una nueva meta para la misma filial y fecha sustituye la anterior
              en el reporte; conserva su historial.
            </p>
          </>
        )}
        {kind === "cash_count" && (
          <>
            {select("account_id", "Cuenta de caja", ownAccounts)}
            {field("counted", "Efectivo contado (moneda de la caja)")}
            {field("note", "Observación (opcional)", "text", false)}
          </>
        )}
        {kind === "funds_transfer" && (
          <>
            {select(
              "source_account_id",
              "Cuenta de origen",
              accounts
                .filter((a) => a.status === "activa")
                .map((a) => ({
                  id: String(a.id),
                  name: `${a.filial} · ${a.name} · ${String(a.currency).toUpperCase()}`,
                })),
            )}
            {select(
              "destination_account_id",
              "Cuenta de destino",
              accounts
                .filter(
                  (a) =>
                    a.status === "activa" &&
                    a.filial_id !==
                      accounts.find((s) => s.id === fields.source_account_id)
                        ?.filial_id &&
                    a.currency ===
                      accounts.find((s) => s.id === fields.source_account_id)
                        ?.currency,
                )
                .map((a) => ({
                  id: String(a.id),
                  name: `${a.filial} · ${a.name} · ${String(a.currency).toUpperCase()}`,
                })),
            )}
            {field("amount", "Monto en la moneda de las cuentas")}
            {field("reference", "Referencia")}
            <p className="text-xs text-steel">
              Registra un movimiento ya realizado entre cuentas de distintas
              filiales en la misma moneda. Genera la salida y la entrada juntas.
            </p>
          </>
        )}
        {kind === "tax" && (
          <>
            {field("name", "Obligación / impuesto")}
            {select("currency", "Moneda", [
              { id: "usd", name: "USD" },
              { id: "bs", name: "Bolívares" },
              { id: "eur", name: "EUR" },
            ])}
            {field("amount", "Importe")}
            {field("due_date", "Vencimiento", "date")}
          </>
        )}
        {kind === "tax_payment" && (
          <>
            {select(
              "obligation_id",
              "Obligación pendiente",
              taxes
                .filter((t) => t.filial_id === fields.filial_id)
                .map((t) => ({
                  id: String(t.id),
                  name: `${t.description} · ${t.amount} ${t.currency}`,
                })),
            )}
            {select("account_id", "Cuenta que paga", ownAccounts)}
            {field("amount", "Monto del pago")}
            {field("reference", "Referencia")}
          </>
        )}
        {kind === "opportunity" && (
          <>
            <label className="block text-sm font-medium">
              Oportunidad
              <select
                value={fields.opportunity_id ?? ""}
                onChange={(e) => {
                  const o = opportunities.find((x) => x.id === e.target.value);
                  setFields((old) => ({
                    ...old,
                    opportunity_id: e.target.value,
                    ...(o
                      ? {
                          filial_id: String(o.filial_id),
                          client: String(o.client),
                          description: String(o.description),
                          amount: String(o.amount),
                          stage: String(o.stage),
                        }
                      : {}),
                  }));
                }}
                className={inputClass}
              >
                <option value="">Nueva oportunidad</option>
                {opportunities.map((o) => (
                  <option key={String(o.id)} value={String(o.id)}>
                    {String(o.client)} · {String(o.description)}
                  </option>
                ))}
              </select>
            </label>
            {field("client", "Cliente")}
            {field("description", "Oportunidad / cotización")}
            {field("amount", "Valor estimado (USD)")}
            {select(
              "stage",
              "Etapa",
              [
                "contacto",
                "cotizacion",
                "negociacion",
                "ganada",
                "perdida",
              ].map((s) => ({ id: s, name: s })),
            )}
          </>
        )}
        {kind === "stock_transfer" && (
          <>
            {select(
              "source_warehouse_id",
              "Almacén de origen",
              warehouses.map((w) => ({
                id: String(w.id),
                name: `${w.filial} · ${w.name}`,
              })),
            )}
            {select(
              "destination_warehouse_id",
              "Almacén de destino",
              warehouses
                .filter(
                  (w) =>
                    w.filial_id !==
                    warehouses.find((x) => x.id === fields.source_warehouse_id)
                      ?.filial_id,
                )
                .map((w) => ({
                  id: String(w.id),
                  name: `${w.filial} · ${w.name}`,
                })),
            )}
            {select(
              "source_part_id",
              "Repuesto de origen",
              parts
                .filter(
                  (p) =>
                    p.filial_id ===
                    warehouses.find((w) => w.id === fields.source_warehouse_id)
                      ?.filial_id,
                )
                .map((p) => ({
                  id: String(p.id),
                  name: `${p.code} · ${p.name} · disponible ${p.stock}`,
                })),
            )}
            {select(
              "destination_part_id",
              "Repuesto del catálogo de destino",
              parts
                .filter(
                  (p) =>
                    p.filial_id ===
                    warehouses.find(
                      (w) => w.id === fields.destination_warehouse_id,
                    )?.filial_id,
                )
                .map((p) => ({
                  id: String(p.id),
                  name: `${p.code} · ${p.name}`,
                })),
            )}
            {field("quantity", "Cantidad de unidades", "number")}
            {field("note", "Motivo del traslado")}
            <p className="text-xs text-steel">
              La solicitud requiere aprobación. El stock sale al despachar y
              entra al confirmar recepción en destino, conservando los costos
              FIFO.
            </p>
          </>
        )}
        {kind === "stock_transfer_action" && (
          <>
            {select(
              "transfer_id",
              "Traslado",
              transfers
                .filter(
                  (t) => !["received", "rejected"].includes(String(t.stage)),
                )
                .map((t) => ({
                  id: String(t.id),
                  name: `${t.origin} → ${t.destination} · ${t.note} · ${t.stage}`,
                })),
            )}
            {select(
              "action",
              "Siguiente acción",
              (
                (
                  {
                    requested: ["approve", "reject"],
                    approved: ["dispatch", "reject"],
                    dispatched: ["receive"],
                  } as Record<string, string[]>
                )[
                  String(
                    transfers.find((t) => t.id === fields.transfer_id)?.stage,
                  )
                ] ?? []
              ).map((id) => ({
                id,
                name: (
                  {
                    approve: "Aprobar",
                    reject: "Rechazar",
                    dispatch: "Confirmar despacho",
                    receive: "Confirmar recepción",
                  } as Record<string, string>
                )[id],
              })),
            )}
            {field("note", "Observación / evidencia de la operación")}
          </>
        )}
        {kind === "risk_policy" && (
          <>
            {field(
              "max_discount_percentage",
              "Descuento máximo sobre PVP % (opcional)",
              "number",
              false,
            )}
            {field(
              "workshop_warning_hours",
              "Avisar permanencia en taller a partir de (horas)",
              "number",
              false,
            )}
            <p className="text-xs text-steel">
              Sin descuento máximo, ese monitor queda desactivado. Sin umbral de
              horas, se usa 48. Estas alertas no cambian las autorizaciones ni
              los precios existentes.
            </p>
          </>
        )}
        {kind === "vehicle_delivery" && (
          <>
            {select(
              "vehicle_id",
              "Vehículo vendido pendiente de entrega",
              vehicles
                .filter(
                  (v) =>
                    v.filial_id === fields.filial_id && v.status === "vendido",
                )
                .map((v) => ({
                  id: String(v.id),
                  name: `${v.vehicle} · ${v.vin}`,
                })),
            )}
            {field("note", "Constancia / observación de entrega")}
            <p className="text-xs text-steel">
              Confirma únicamente una entrega realizada. El inventario
              consolidado distinguirá esta unidad como entregada.
            </p>
          </>
        )}
        {kind === "journal" && (
          <>
            {field("description", "Concepto del asiento")}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={elimination}
                onChange={(e) => setElimination(e.target.checked)}
              />
              Eliminación intercompañía (solo consolidado)
            </label>
            <p className="rounded-xl bg-blue-light p-3 text-xs text-blue">
              Importes en USD. El asiento requiere debe = haber. Para
              corregirlo, registra un asiento inverso.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr>
                    {["Cuenta", "Clasificación", "Debe", "Haber"].map((x) => (
                      <th key={x} className="p-1">
                        {x}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, index) => (
                    <tr key={index}>
                      {["account", "category", "debit", "credit"].map((key) => (
                        <td key={key} className="p-1">
                          {key === "category" ? (
                            <select
                              aria-label={`Clasificación línea ${index + 1}`}
                              value={line.category}
                              onChange={(e) =>
                                setLines((old) =>
                                  old.map((l, i) =>
                                    i === index
                                      ? { ...l, category: e.target.value }
                                      : l,
                                  ),
                                )
                              }
                              className={inputClass}
                            >
                              {[
                                { id: "asset", label: "Activo" },
                                { id: "liability", label: "Pasivo" },
                                { id: "equity", label: "Patrimonio" },
                                { id: "revenue", label: "Ingreso" },
                                { id: "cost", label: "Costo" },
                                { id: "expense", label: "Gasto" },
                              ].map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              required={key === "account"}
                              aria-label={`${key} línea ${index + 1}`}
                              value={line[key as keyof typeof line]}
                              onChange={(e) =>
                                setLines((old) =>
                                  old.map((l, i) =>
                                    i === index
                                      ? {
                                          ...l,
                                          [key]:
                                            key === "account"
                                              ? e.target.value
                                              : formatMoneyInput(
                                                  e.target.value,
                                                ),
                                        }
                                      : l,
                                  ),
                                )
                              }
                              className={`${inputClass} ${key === "account" ? "min-w-36" : "min-w-24"}`}
                            />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() =>
                  setLines((old) => [
                    ...old,
                    { account: "", category: "asset", debit: "", credit: "" },
                  ])
                }
                className="text-sm font-semibold text-blue"
              >
                + Agregar línea
              </button>
              {lines.length > 2 && (
                <button
                  type="button"
                  onClick={() => setLines((old) => old.slice(0, -1))}
                  className="text-sm text-steel"
                >
                  Quitar última línea
                </button>
              )}
            </div>
          </>
        )}
        {loading && (
          <p className="text-xs text-steel">Cargando cuentas y obligaciones…</p>
        )}
        {error && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
