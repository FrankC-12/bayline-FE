"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, X, Plus, Loader2, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useParts } from "@/hooks/useParts";
import { usePartSales } from "@/hooks/usePartSales";
import { useClients } from "@/hooks/useClients";
import ClientFormPanel from "@/components/clients/ClientFormPanel";
import type { Client } from "@/types/client";
import type { CreateClientInput } from "@/lib/api/clients";

interface LineDraft {
  partId: string;
  search: string;
  quantity: string;
}

const DISCOUNT_OPTIONS = [
  "Costo + 30% (Sin Descuento)",
  "Costo + 20% (Descuento 10%)",
  "Costo + 10% (Descuento 20%)",
  "Precio de costo",
];

function emptyLine(): LineDraft {
  return { partId: "", search: "", quantity: "0" };
}

export default function NewPartSaleView() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;

  const { parts } = useParts(filialId);
  const { addSale } = usePartSales(filialId);

  const [clientSearch, setClientSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [createClientOpen, setCreateClientOpen] = useState(false);
  const { clients, addClient } = useClients(filialId, clientSearch || undefined);

  const [requestReason, setRequestReason] = useState("Venta de Repuestos");
  const [discountLabel, setDiscountLabel] = useState(DISCOUNT_OPTIONS[0]);
  const [lines, setLines] = useState<LineDraft[]>([emptyLine()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = useMemo(() => {
    return lines.reduce((sum, line) => {
      const part = parts.find((p) => p.id === line.partId);
      const qty = Number(line.quantity) || 0;
      return sum + (part ? part.price * qty : 0);
    }, 0);
  }, [lines, parts]);

  function updateLine(index: number, patch: Partial<LineDraft>) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  function removeLine(index: number) {
    setLines((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  function addLine() {
    setLines((prev) => [...prev, emptyLine()]);
  }

  function resultsFor(term: string) {
    if (!term) return [];
    const t = term.toLowerCase();
    return parts.filter((p) => p.code.toLowerCase().includes(t) || p.name.toLowerCase().includes(t)).slice(0, 6);
  }

  async function handleCreateClient(input: CreateClientInput) {
    const created = await addClient(input);
    setSelectedClient(created);
    setClientSearch("");
  }

  async function handleSubmit() {
    if (!filialId || !selectedClient) return;
    const validLines = lines.filter((l) => l.partId && Number(l.quantity) > 0);
    if (validLines.length === 0) {
      setError("Agrega al menos una línea de repuesto con cantidad mayor a 0.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await addSale({
        filial_id: filialId,
        client_name: selectedClient.full_name,
        client_document: `${selectedClient.document_type}-${selectedClient.document_number}`,
        request_reason: requestReason,
        discount_label: discountLabel,
        lines: validLines.map((l) => ({ part_id: l.partId, quantity: Number(l.quantity) })),
      });
      router.push("/dashboard/repuestos/ventas");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la venta.");
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

      <h1 className="mb-6 font-display text-3xl font-bold text-navy">Nueva Venta de Repuestos</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-navy/10 bg-white p-6">
            <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-steel">Cliente</p>

            {selectedClient ? (
              <div className="flex items-center justify-between rounded-xl border border-navy/10 bg-ash px-4 py-3">
                <div>
                  <p className="font-medium text-navy">{selectedClient.full_name}</p>
                  <p className="font-mono text-xs text-steel">
                    {selectedClient.document_type}-{selectedClient.document_number}
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
                    onChange={(e) => setClientSearch(e.target.value)}
                    placeholder="Buscar por nombre o cédula/RIF..."
                    className="w-full rounded-xl border border-navy/15 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
                  />
                </div>
                {clientSearch && (
                  <div className="mt-2 divide-y divide-navy/5 rounded-xl border border-navy/10">
                    {clients.length > 0 ? (
                      clients.slice(0, 6).map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setSelectedClient(c);
                            setClientSearch("");
                          }}
                          className="block w-full px-4 py-2.5 text-left text-sm hover:bg-ash"
                        >
                          <p className="font-medium text-navy">{c.full_name}</p>
                          <p className="font-mono text-xs text-steel">
                            {c.document_type}-{c.document_number}
                          </p>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-steel">No se encontró ningún cliente.</div>
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
              Motivo de solicitud
            </p>
            <input
              value={requestReason}
              onChange={(e) => setRequestReason(e.target.value)}
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
            />
          </div>

          <div className="rounded-2xl border border-navy/10 bg-white p-6">
            <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-steel">
              Líneas de repuesto
            </p>
            <div className="space-y-3">
              {lines.map((line, i) => (
                <div key={i} className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      value={line.search}
                      onChange={(e) => updateLine(i, { search: e.target.value, partId: "" })}
                      placeholder="Buscar por código o nombre..."
                      className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
                    />
                    {line.search && !line.partId && resultsFor(line.search).length > 0 && (
                      <div className="absolute z-10 mt-1 w-full divide-y divide-navy/5 rounded-xl border border-navy/10 bg-white shadow-lg">
                        {resultsFor(line.search).map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => updateLine(i, { partId: p.id, search: `${p.code} · ${p.name}` })}
                            className="block w-full px-4 py-2 text-left text-sm hover:bg-ash"
                          >
                            <p className="font-medium text-navy">{p.name}</p>
                            <p className="text-xs text-steel">
                              {p.code} · ${p.price.toFixed(2)}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={line.quantity}
                    onChange={(e) => updateLine(i, { quantity: e.target.value })}
                    className="w-24 rounded-xl border border-navy/15 px-3 py-2.5 text-center text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
                  />
                  <button
                    type="button"
                    onClick={() => removeLine(i)}
                    className="rounded-xl border border-navy/15 p-2.5 text-red-500 transition hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
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

          {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-navy/10 bg-white p-6">
            <p className="mb-2 font-display text-sm font-bold text-navy">Descuento Global</p>
            <select
              value={discountLabel}
              onChange={(e) => setDiscountLabel(e.target.value)}
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
            >
              {DISCOUNT_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>

            <div className="mt-4 rounded-xl bg-blue-light px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-navy">Total</span>
                <span className="font-display text-lg font-bold text-blue">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <p className="rounded-xl bg-ash px-4 py-3 text-xs text-steel">
            Esta venta se despacha desde tu filial.
          </p>

          <button
            onClick={handleSubmit}
            disabled={submitting || !selectedClient}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-blue px-6 py-3 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Enviar a Almacén
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