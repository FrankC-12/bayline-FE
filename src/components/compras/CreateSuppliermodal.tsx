"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import type { CreateSupplierInput } from "@/lib/api/administracion";
import { formatVenezuelanPhone } from "@/lib/format";

interface CreateSupplierModalProps {
  open: boolean;
  onClose: () => void;
  filialId: string;
  onSubmit: (input: CreateSupplierInput) => Promise<unknown>;
}

export default function CreateSupplierModal({ open, onClose, filialId, onSubmit }: CreateSupplierModalProps) {
  const [businessName, setBusinessName] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [rif, setRif] = useState("J-");
  const [supplierType, setSupplierType] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountCurrency, setAccountCurrency] = useState<"usd" | "bs" | "eur">("bs");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = businessName.trim() && rif.trim() && supplierType && (!paymentMethod || accountHolder.trim());

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        filial_id: filialId,
        business_name: businessName,
        trade_name: tradeName || null,
        rif,
        supplier_type: supplierType,
        contact_person: contactPerson || null,
        phone: phone ? phone.replace(/\D/g, "") : null,
        email: email || null,
        address: address || null,
        payment_accounts: paymentMethod && accountHolder.trim() ? [{
          payment_method: paymentMethod as "transferencia" | "pago_movil" | "zelle" | "efectivo" | "otro",
          bank_name: bankName || null,
          account_holder: accountHolder,
          document: rif || null,
          account_number: accountNumber || null,
          account_type: null,
          currency: accountCurrency,
          phone: phone ? phone.replace(/\D/g, "") : null,
          email: email || null,
          notes: null,
          is_active: true,
        }] : [],
      });
      setBusinessName("");
      setTradeName("");
      setRif("J-");
      setSupplierType("");
      setContactPerson("");
      setPhone("");
      setEmail("");
      setAddress("");
      setPaymentMethod("");
      setBankName("");
      setAccountHolder("");
      setAccountNumber("");
      setAccountCurrency("bs");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el proveedor.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div onClick={onClose} className="absolute inset-0 bg-navy/40" />
      <aside className="relative flex h-full w-full max-w-md flex-col overflow-y-auto bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-navy/10 px-8 py-5">
          <h2 className="font-display text-xl font-bold text-navy">Crear Nuevo Proveedor</h2>
          <button onClick={onClose} aria-label="Cerrar" className="rounded-lg p-2 text-steel hover:bg-ash hover:text-navy">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 p-8">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Razón social</label>
            <input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Ej. Repuestos Andinos C.A."
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Nombre comercial (opcional)</label>
            <input
              value={tradeName}
              onChange={(e) => setTradeName(e.target.value)}
              placeholder="Ej. Andinos Repuestos"
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">RIF</label>
            <input
              value={rif}
              onChange={(e) => setRif(e.target.value)}
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Tipo de proveedor</label>
            <select
              value={supplierType}
              onChange={(e) => setSupplierType(e.target.value)}
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
            >
              <option value="">Seleccionar tipo...</option>
              <option value="fabricante">Fabricante</option>
              <option value="nacional">Nacional</option>
              <option value="importador">Importador</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Persona de contacto</label>
            <input
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              placeholder="Ej. Carmen Villegas"
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Teléfono</label>
            <input
              inputMode="tel"
              value={formatVenezuelanPhone(phone)}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
              placeholder="(0414) 123-4567"
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Correo electrónico</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ventas@proveedor.com"
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Dirección</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              placeholder="Av. Principal, edificio, ciudad, estado"
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
            />
          </div>

          <div className="border-t border-navy/10 pt-5">
            <h3 className="mb-1 font-semibold text-navy">Cuenta o método de pago</h3>
            <p className="mb-4 text-xs text-steel">Opcional; quedará visible en la ficha del proveedor.</p>
            <div className="space-y-4">
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue">
                <option value="">Sin método registrado</option>
                <option value="transferencia">Transferencia bancaria</option>
                <option value="pago_movil">Pago móvil</option>
                <option value="zelle">Zelle</option>
                <option value="efectivo">Efectivo</option>
                <option value="otro">Otro</option>
              </select>
              {paymentMethod && <>
                <input value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} placeholder="Titular de la cuenta *" className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue" />
                <div className="grid grid-cols-2 gap-3">
                  <input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Banco" className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue" />
                  <select value={accountCurrency} onChange={(e) => setAccountCurrency(e.target.value as "usd" | "bs" | "eur")} className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue">
                    <option value="bs">Bolívares</option><option value="usd">USD</option><option value="eur">EUR</option>
                  </select>
                </div>
                <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value.replace(/\s/g, ""))} placeholder="Número de cuenta, teléfono o correo" className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue" />
              </>}
            </div>
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 border-t border-navy/10 p-6">
          <button
            onClick={onClose}
            className="rounded-full border border-navy/15 px-5 py-2.5 text-sm font-semibold text-navy transition hover:border-navy/40"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="flex items-center justify-center gap-2 rounded-full bg-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Crear Proveedor
          </button>
        </div>
      </aside>
    </div>
  );
}
