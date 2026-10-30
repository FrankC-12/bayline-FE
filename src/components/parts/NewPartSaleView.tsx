"use client";

import { NumberInput } from "@/components/ui/NumberInput";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  X,
  Plus,
  Loader2,
  Search,
  ShoppingCart,
  Check,
  Package,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useParts } from "@/hooks/useParts";
import { usePartSales } from "@/hooks/usePartSales";
import { useClients } from "@/hooks/useClients";
import ClientFormPanel from "@/components/clients/ClientFormPanel";
import type { Client } from "@/types/client";
import type { CreateClientInput } from "@/lib/api/clients";

import { listWarehouses } from "@/lib/api/warehouse";
import { quotePartSale, type PartSaleQuote } from "@/lib/api/parts";
import { ApiError } from "@/lib/api/client";
import type { Warehouse } from "@/types/warehouse";
import PartAvailabilityHint from "@/components/warehouse/PartAvailabilityHint";

import { DISCOUNT_OPTIONS, type DiscountLabel } from "@/lib/partsPricing";
import { formatDocumentId, formatMoney, formatCount } from "@/lib/format";

interface LineDraft {
  partId: string;
  search: string;
  quantity: string;
}

function emptyLine(): LineDraft {
  return { partId: "", search: "", quantity: "1" };
}

/** The server anchors a sobreventa (insufficient stock) error to the part_id
 * it's about, not a line index — a sale can have several lines for
 * different parts, so this matches each fieldError back to the line(s) that
 * reference that part. */
function lineErrorsFromApiError(
  err: unknown,
  lines: LineDraft[],
): Record<number, string> {
  if (!(err instanceof ApiError) || err.fieldErrors.length === 0) return {};
  const messageByPartId = new Map(
    err.fieldErrors.map((fe) => [fe.field, fe.message]),
  );
  const result: Record<number, string> = {};
  lines.forEach((line, i) => {
    const message = messageByPartId.get(line.partId);
    if (message) result[i] = message;
  });
  return result;
}

export default function NewPartSaleView() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;

  const { parts } = useParts(filialId);
  const { addSale } = usePartSales(filialId);

  // Default: a walk-in counter sale needs nothing but a name — "Consumidor
  // Final" is editable so the cashier can jot down a real name without a
  // full Client record. Only checking this box (to actually bill the sale
  // to a registered client's name/document) requires the full flow below.
  const [wantsInvoiceToClient, setWantsInvoiceToClient] = useState(false);
  const [genericClientName, setGenericClientName] =
    useState("Consumidor Final");
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientPickerOpen, setClientPickerOpen] = useState(false);
  const [createClientOpen, setCreateClientOpen] = useState(false);
  const { clients, loading: clientsLoading, addClient } = useClients(filialId);
  const clientReady = wantsInvoiceToClient
    ? selectedClient !== null
    : genericClientName.trim().length >= 2;

  const [quoteRevision, setQuoteRevision] = useState(0);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [discountLabel, setDiscountLabel] = useState<DiscountLabel>(
    DISCOUNT_OPTIONS[0],
  );
  const [lines, setLines] = useState<LineDraft[]>([emptyLine()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseId, setWarehouseId] = useState("");
  const [quote, setQuote] = useState<{
    key: string;
    value: PartSaleQuote;
  } | null>(null);
  const [quoteError, setQuoteError] = useState<{
    key: string;
    message: string;
  } | null>(null);
  const [lineErrors, setLineErrors] = useState<Record<number, string>>({});
  const quoteKey = JSON.stringify({
    filialId,
    warehouseId,
    lines,
    discountLabel,
    quoteRevision,
  });
  const currentQuote = quote?.key === quoteKey ? quote.value : null;
  const validDraft =
    lines.length > 0 &&
    lines.every(
      (line) =>
        line.partId &&
        Number.isInteger(Number(line.quantity)) &&
        Number(line.quantity) > 0,
    );

  useEffect(() => {
    let active = true;
    setWarehouses([]);
    setWarehouseId("");
    if (filialId)
      listWarehouses(filialId)
        .then((items) => {
          if (!active) return;
          const available = items.filter((item) => item.is_active);
          setWarehouses(available);
          if (available.length === 1) setWarehouseId(available[0].id);
        })
        .catch((err) => {
          if (active)
            setError(
              err instanceof Error
                ? err.message
                : "No se pudieron cargar los almacenes.",
            );
        });
    return () => {
      active = false;
    };
  }, [filialId]);

  useEffect(() => {
    let active = true;
    if (!filialId || !warehouseId || !validDraft) return;
    const timer = setTimeout(() => {
      quotePartSale({
        filial_id: filialId,
        warehouse_id: warehouseId,
        discount_label: discountLabel,
        lines: lines.map((line) => ({
          part_id: line.partId,
          quantity: Number(line.quantity),
        })),
      })
        .then((value) => {
          if (active) {
            setQuote({ key: quoteKey, value });
            setQuoteError(null);
            setLineErrors({});
          }
        })
        .catch((err) => {
          if (!active) return;
          const fromLines = lineErrorsFromApiError(err, lines);
          setLineErrors(fromLines);
          if (Object.keys(fromLines).length === 0) {
            setQuoteError({
              key: quoteKey,
              message:
                err instanceof Error ? err.message : "No se pudo cotizar.",
            });
          } else {
            setQuoteError(null);
          }
        });
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [filialId, warehouseId, validDraft, lines, discountLabel, quoteKey]);

  const clientResults = useMemo(() => {
    const term = clientSearch.toLowerCase().replace(/[\s.-]/g, "");
    if (!term) return clients.slice(0, 6);
    return clients
      .filter((client) => {
        const document =
          `${client.document_type}${client.document_number}`.toLowerCase();
        return (
          client.full_name
            .toLowerCase()
            .replace(/[\s.-]/g, "")
            .includes(term) ||
          document.replace(/[\s.-]/g, "").includes(term) ||
          client.document_number.toLowerCase().includes(term) ||
          client.phone_primary.replace(/\D/g, "").includes(term)
        );
      })
      .slice(0, 6);
  }, [clientSearch, clients]);

  function updateLine(index: number, patch: Partial<LineDraft>) {
    setLines((prev) =>
      prev.map((l, i) => (i === index ? { ...l, ...patch } : l)),
    );
  }

  function removeLine(index: number) {
    setLines((prev) =>
      prev.length > 1 ? prev.filter((_, i) => i !== index) : prev,
    );
  }

  function addLine() {
    setLines((prev) => [...prev, emptyLine()]);
  }

  function resultsFor(term: string) {
    if (!term) return [];
    const t = term.toLowerCase();
    return parts
      .filter(
        (p) =>
          !lines.some((line) => line.partId === p.id) &&
          (p.code.toLowerCase().includes(t) ||
            p.name.toLowerCase().includes(t)),
      )
      .slice(0, 6);
  }

  const quickParts = useMemo(
    () =>
      parts
        .filter(
          (part) =>
            part.is_active &&
            (!inStockOnly || part.stock_total > 0) &&
            `${part.code} ${part.name} ${part.category_name}`
              .toLowerCase()
              .includes(catalogSearch.toLowerCase()),
        )
        .slice(0, 8),
    [parts, inStockOnly, catalogSearch],
  );
  function quickAdd(partId: string) {
    setLines((previous) => {
      const existing = previous.find((line) => line.partId === partId);
      if (existing)
        return previous.map((line) =>
          line.partId === partId
            ? { ...line, quantity: String(Number(line.quantity || 0) + 1) }
            : line,
        );
      const part = parts.find((item) => item.id === partId);
      return [
        ...previous.filter((line) => line.partId || line.search),
        {
          partId,
          search: part ? `${part.code} · ${part.name}` : "",
          quantity: "1",
        },
      ];
    });
  }
  async function handleCreateClient(input: CreateClientInput) {
    const created = await addClient(input);
    setSelectedClient(created);
    setClientSearch("");
    setClientPickerOpen(false);
  }

  async function handleSubmit() {
    if (
      !filialId ||
      !clientReady ||
      !warehouseId ||
      !currentQuote ||
      !validDraft
    )
      return;
    const validLines = lines.filter((l) => l.partId && Number(l.quantity) > 0);
    if (validLines.length === 0) {
      setError("Agrega al menos una línea de repuesto con cantidad mayor a 0.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setLineErrors({});
    try {
      const created = await addSale({
        quote_hash: currentQuote.quote_hash,
        filial_id: filialId,
        warehouse_id: warehouseId,
        client_id: wantsInvoiceToClient ? selectedClient!.id : null,
        client_name: wantsInvoiceToClient
          ? selectedClient!.full_name
          : genericClientName.trim(),
        client_document: wantsInvoiceToClient
          ? `${selectedClient!.document_type}-${selectedClient!.document_number}`
          : null,
        discount_label: discountLabel,
        lines: validLines.map((l) => ({
          part_id: l.partId,
          quantity: Number(l.quantity),
        })),
      });
      router.push(`/dashboard/repuestos/ventas/${created.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.errorCode === "sale_quote_changed") {
        setQuote(null);
        setQuoteRevision((value) => value + 1);
      }
      const fromLines = lineErrorsFromApiError(err, lines);
      setLineErrors(fromLines);
      if (Object.keys(fromLines).length === 0) {
        setError(
          err instanceof Error ? err.message : "No se pudo crear la venta.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <Link
        href="/dashboard/repuestos/ventas"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-steel hover:text-navy"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver a Ventas de Repuestos
      </Link>

      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 font-mono text-xs uppercase tracking-widest text-blue">
            Mostrador
          </p>
          <h1 className="font-display text-3xl font-bold text-navy">
            Nueva venta de repuestos
          </h1>
          <p className="mt-2 text-sm text-steel">
            Arma el pedido, revisa el precio y sigue el despacho desde una sola
            venta.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-blue/10 bg-blue-light px-5 py-4 text-blue">
          <ShoppingCart className="h-6 w-6" />
          <div>
            <p className="text-xs">Tu pedido</p>
            <p className="font-bold">
              {formatCount(
                lines
                  .filter((line) => line.partId)
                  .reduce((sum, line) => sum + Number(line.quantity || 0), 0),
              )}{" "}
              unidades
            </p>
          </div>
        </div>
      </header>
      <ol className="mb-6 grid gap-3 sm:grid-cols-3">
        {[
          { label: "Cliente y almacén", ready: clientReady && !!warehouseId },
          { label: "Seleccionar repuestos", ready: validDraft },
          { label: "Revisar y enviar", ready: !!currentQuote },
        ].map((item, index) => (
          <li
            key={item.label}
            className={`flex items-center gap-3 rounded-xl border p-4 text-sm ${item.ready ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-navy/10 bg-white text-steel"}`}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white font-mono text-xs">
              {item.ready ? <Check className="h-4 w-4" /> : index + 1}
            </span>
            {item.label}
          </li>
        ))}
      </ol>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <section className="rounded-2xl border border-navy/10 bg-white p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-lg font-bold text-navy">
                Agrega repuestos al pedido
              </h2>
              <label className="flex items-center gap-2 text-xs text-steel">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(event) => setInStockOnly(event.target.checked)}
                />
                Con existencia
              </label>
            </div>
            <label className="mb-4 flex items-center gap-2 rounded-xl border border-navy/15 px-3 py-3">
              <Search className="h-4 w-4 text-steel" />
              <input
                aria-label="Buscar en catálogo de venta"
                value={catalogSearch}
                onChange={(event) => setCatalogSearch(event.target.value)}
                placeholder="Código, nombre o categoría"
                className="w-full bg-transparent text-sm outline-none"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              {quickParts.map((part) => (
                <button
                  key={part.id}
                  type="button"
                  onClick={() => quickAdd(part.id)}
                  className="group rounded-xl border border-navy/10 p-4 text-left transition hover:border-blue hover:bg-blue-light/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="rounded-lg bg-blue-light p-2 text-blue">
                      <Package className="h-4 w-4" />
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] text-steel">
                      {formatCount(part.stock_total)} disponibles
                    </span>
                  </div>
                  <p className="mt-3 font-mono text-[11px] text-blue">
                    {part.code}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-navy">
                    {part.name}
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-xs text-steel">
                      {part.reference_price == null
                        ? "Precio al cotizar"
                        : `Ref. $${formatMoney(part.reference_price)}`}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-semibold text-blue">
                      <Plus className="h-3 w-3" />
                      Agregar
                    </span>
                  </div>
                </button>
              ))}
            </div>
            {!quickParts.length && (
              <p className="py-5 text-center text-sm text-steel">
                No hay repuestos para esta búsqueda.
              </p>
            )}
            <p className="mt-4 text-xs text-steel">
              La referencia es orientativa. La cotización calcula el FIFO del
              almacén elegido y muestra el precio definitivo antes de enviar.
            </p>
          </section>
          <div className="rounded-2xl border border-navy/10 bg-white p-6">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-mono text-[11px] uppercase tracking-widest text-steel">
                Cliente
              </p>
              <label className="flex items-center gap-2 text-xs font-medium text-navy">
                <input
                  type="checkbox"
                  checked={wantsInvoiceToClient}
                  onChange={(e) => {
                    setWantsInvoiceToClient(e.target.checked);
                    if (!e.target.checked) setSelectedClient(null);
                  }}
                  className="h-4 w-4 rounded border-navy/30 text-blue focus:ring-blue/30"
                />
                Facturar a nombre de un cliente registrado
              </label>
            </div>

            {!wantsInvoiceToClient ? (
              <div>
                <input
                  value={genericClientName}
                  onChange={(e) => setGenericClientName(e.target.value)}
                  placeholder="Nombre del cliente"
                  className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
                />
                <p className="mt-1.5 text-xs text-steel">
                  Venta de mostrador — no requiere una ficha de cliente. Marca
                  la casilla de arriba solo si necesitas facturar a nombre de un
                  cliente registrado (cédula/RIF).
                </p>
              </div>
            ) : selectedClient ? (
              <div className="flex items-center justify-between rounded-xl border border-navy/10 bg-ash px-4 py-3">
                <div>
                  <p className="font-medium text-navy">
                    {selectedClient.full_name}
                  </p>
                  <p className="font-mono text-xs text-steel">
                    {formatDocumentId(
                      selectedClient.document_type,
                      selectedClient.document_number,
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedClient(null)}
                  className="text-xs font-semibold text-blue hover:text-navy"
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" />
                  <input
                    value={clientSearch}
                    onFocus={() => setClientPickerOpen(true)}
                    onChange={(e) => {
                      setClientSearch(e.target.value);
                      setClientPickerOpen(true);
                    }}
                    placeholder="Buscar por nombre o cédula/RIF..."
                    className="w-full rounded-xl border border-navy/15 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
                  />
                </div>
                {clientPickerOpen && (
                  <div className="mt-2 divide-y divide-navy/5 rounded-xl border border-navy/10">
                    {clientsLoading ? (
                      <div className="px-4 py-3 text-sm text-steel">
                        Buscando clientes...
                      </div>
                    ) : clientResults.length > 0 ? (
                      clientResults.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setSelectedClient(c);
                            setClientSearch("");
                            setClientPickerOpen(false);
                          }}
                          className="block w-full px-4 py-2.5 text-left text-sm hover:bg-ash"
                        >
                          <p className="font-medium text-navy">{c.full_name}</p>
                          <p className="font-mono text-xs text-steel">
                            {formatDocumentId(
                              c.document_type,
                              c.document_number,
                            )}
                          </p>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-steel">
                        No se encontró ningún cliente.
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setCreateClientOpen(true)}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold text-blue hover:bg-blue-light"
                    >
                      <Plus className="h-4 w-4" />
                      Crear nuevo cliente
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-navy/10 bg-white p-6">
            <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-steel">
              Líneas de repuesto
            </p>
            <div className="space-y-3">
              {lines.map((line, i) => (
                <div key={i}>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        value={line.search}
                        onChange={(e) =>
                          updateLine(i, { search: e.target.value, partId: "" })
                        }
                        placeholder="Buscar por código o nombre..."
                        className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20 ${
                          lineErrors[i] ? "border-red-400" : "border-navy/15"
                        }`}
                      />
                      {line.search &&
                        !line.partId &&
                        resultsFor(line.search).length > 0 && (
                          <div className="absolute z-10 mt-1 w-full divide-y divide-navy/5 rounded-xl border border-navy/10 bg-white shadow-lg">
                            {resultsFor(line.search).map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() =>
                                  updateLine(i, {
                                    partId: p.id,
                                    search: `${p.code} · ${p.name}`,
                                  })
                                }
                                className="block w-full px-4 py-2 text-left text-sm hover:bg-ash"
                              >
                                <p className="font-medium text-navy">
                                  {p.name}
                                </p>
                                <p className="text-xs text-steel">{p.code}</p>
                              </button>
                            ))}
                          </div>
                        )}
                    </div>
                    <NumberInput
                      min="1"
                      step="1"
                      value={line.quantity}
                      onValueChange={(value) =>
                        updateLine(i, { quantity: value })
                      }
                      className={`w-24 rounded-xl border px-3 py-2.5 text-center text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20 ${
                        lineErrors[i] ? "border-red-400" : "border-navy/15"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => removeLine(i)}
                      className="rounded-xl border border-navy/15 p-2.5 text-red-500 transition hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  {line.partId && (
                    <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-xs">
                      <div>
                        <p className="text-steel">Precio unitario</p>
                        <p className="mt-1 font-semibold text-navy">
                          {currentQuote?.lines.find(
                            (item) => item.part_id === line.partId,
                          )
                            ? `$${formatMoney(currentQuote.lines.find((item) => item.part_id === line.partId)!.unit_price)}`
                            : "Por cotizar"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-steel">Total del renglón</p>
                        <p className="mt-1 font-bold text-blue">
                          {currentQuote?.lines.find(
                            (item) => item.part_id === line.partId,
                          )
                            ? `$${formatMoney(currentQuote.lines.find((item) => item.part_id === line.partId)!.line_total)}`
                            : "—"}
                        </p>
                      </div>
                    </div>
                  )}
                  {lineErrors[i] && (
                    <p className="mt-1 text-xs text-red-600">{lineErrors[i]}</p>
                  )}
                  {line.partId && filialId && (
                    <PartAvailabilityHint
                      filialId={filialId}
                      partId={line.partId}
                      warehouses={warehouses}
                      originWarehouseId={warehouseId || undefined}
                    />
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addLine}
              className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-blue hover:text-navy"
            >
              <Plus className="h-4 w-4" />
              Agregar línea
            </button>
          </div>

          {quoteError?.key === quoteKey && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {quoteError.message}
            </p>
          )}
          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>

        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border border-navy/10 bg-white p-6">
            <p className="mb-2 font-display text-sm font-bold text-navy">
              Descuento Global
            </p>
            <select
              value={discountLabel}
              onChange={(e) =>
                setDiscountLabel(e.target.value as DiscountLabel)
              }
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
            >
              {DISCOUNT_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>

            <div className="mt-4 rounded-xl bg-blue-light px-4 py-3">
              {currentQuote ? (
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center justify-between text-steel">
                    <span>Subtotal</span>
                    <span className="font-medium text-navy">
                      ${formatMoney(currentQuote.total)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-steel">
                    <span>
                      IVA ({formatCount(currentQuote.iva_percentage)}%)
                    </span>
                    <span className="font-medium text-navy">
                      ${formatMoney(currentQuote.iva_amount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-steel">
                    <span>
                      IGTF estimado si paga todo en USD (
                      {formatCount(currentQuote.igtf_percentage)}%)
                    </span>
                    <span className="font-medium text-navy">
                      ${formatMoney(currentQuote.igtf_amount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-navy/10 pt-1.5">
                    <span className="font-medium text-navy">Total con IVA</span>
                    <span className="font-display text-lg font-bold text-blue">
                      $
                      {formatMoney(
                        currentQuote.total + currentQuote.iva_amount,
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-steel">
                    El IGTF se registra al cobrar, según el monto recibido en
                    USD.
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="font-medium text-navy">Total</span>
                  <span className="font-display text-lg font-bold text-blue">
                    —
                  </span>
                </div>
              )}
            </div>
          </div>

          <label className="block rounded-xl bg-ash px-4 py-3 text-sm text-navy">
            Almacén de despacho
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              className="mt-2 w-full rounded-xl border border-navy/15 px-3 py-2"
            >
              <option value="">Selecciona un almacén</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </label>
          {currentQuote?.lines.map((line) => (
            <div
              key={line.part_id}
              className="rounded-xl border border-navy/10 px-4 py-3 text-sm"
            >
              <p>{parts.find((part) => part.id === line.part_id)?.name}</p>
              <p>
                {formatCount(line.quantity)} × $
                {formatMoney(line.unit_price, 6)} = $
                {formatMoney(line.line_total)}
              </p>
            </div>
          ))}

          <button
            onClick={handleSubmit}
            disabled={
              submitting || !clientReady || !currentQuote || !validDraft
            }
            className="flex w-full items-center justify-center gap-2 rounded-full bg-blue px-6 py-3 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Crear venta y seguir despacho
          </button>
        </div>
      </div>

      {filialId && (
        <ClientFormPanel
          open={createClientOpen}
          onClose={() => setCreateClientOpen(false)}
          filialId={filialId}
          onSubmit={handleCreateClient}
          editingClient={null}
        />
      )}
    </div>
  );
}
