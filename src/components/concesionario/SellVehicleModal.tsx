"use client";

import { useState } from "react";
import { X, Loader2, Search } from "lucide-react";
import { useClients } from "@/hooks/useClients";
import { useUsers } from "@/hooks/useUser";
import ClientFormPanel from "@/components/clients/ClientFormPanel";
import type { Client } from "@/types/client";
import type { CreateClientInput } from "@/lib/api/clients";
import type { VehicleSaleInput } from "@/lib/api/concesionario";
import type { DealershipVehicle } from "@/types/concesionario";

interface SellVehicleModalProps {
  open: boolean;
  onClose: () => void;
  filialId: string;
  vehicle: DealershipVehicle | null;
  onConfirm: (sale: VehicleSaleInput) => Promise<void>;
}

export default function SellVehicleModal({ open, onClose, filialId, vehicle, onConfirm }: SellVehicleModalProps) {
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [createClientOpen, setCreateClientOpen] = useState(false);
  const { clients, addClient } = useClients(filialId, clientSearch || undefined);
  const { users } = useUsers({ filialId });

  const [advisorId, setAdvisorId] = useState("");
  const [saleType, setSaleType] = useState("contado");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreateClient(input: CreateClientInput) {
    const created = await addClient(input);
    setSelectedClient(created);
    setClientSearch("");
  }

  async function handleConfirm() {
    if (!selectedClient || !vehicle) {
      setError("Selecciona un cliente.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm({
        client_name: selectedClient.full_name,
        client_document: `${selectedClient.document_type}-${selectedClient.document_number}`,
        advisor_user_id: advisorId || null,
        sale_type: saleType,
        final_price: saleType === "contado" ? vehicle.cash_total : vehicle.price_financed,
      });
      setSelectedClient(null);
      setClientSearch("");
      setAdvisorId("");
      setSaleType("contado");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar la venta.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open || !vehicle) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-navy/40" />
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-navy/10 px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-bold text-navy">Marcar como Vendido</h2>
            <p className="text-xs text-steel">
              {vehicle.brand} {vehicle.model} {vehicle.year} · {vehicle.vin}
            </p>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="rounded-lg p-2 text-steel hover:bg-ash hover:text-navy">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Cliente</label>
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
              <div>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" />
                  <input
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    placeholder="Buscar por nombre o cédula/RIF..."
                    className="w-full rounded-xl border border-navy/15 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-blue"
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
                      className="block w-full px-4 py-2.5 text-left text-sm font-semibold text-blue hover:bg-blue-light"
                    >
                      + Crear nuevo cliente
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Asesor</label>
            <select
              value={advisorId}
              onChange={(e) => setAdvisorId(e.target.value)}
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
            >
              <option value="">Sin asignar</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">Tipo</label>
              <select
                value={saleType}
                onChange={(e) => setSaleType(e.target.value)}
                className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
              >
                <option value="contado">Contado</option>
                <option value="financiado">Financiado</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">Precio final ({vehicle.price_currency === "VES" ? "Bs." : "USD"})</label>
              <div className="rounded-xl border border-navy/10 bg-ash px-4 py-2.5 text-sm font-semibold text-navy">
                {vehicle.price_currency === "VES" ? "Bs." : "$"} {(saleType === "contado" ? vehicle.cash_total : vehicle.price_financed).toFixed(2)}
              </div>
            </div>
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Confirmar venta
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
