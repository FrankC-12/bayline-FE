"use client";
import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { NumberInput } from "@/components/ui/NumberInput";
import PaymentReceivedFields from "@/components/service-orders/PaymentReceivedFields";
import { collectPartPayment, getPartBilling, quotePartPayment, type PartBillingContext, type PartPaymentQuote } from "@/lib/api/parts";

export default function PartPaymentModal({saleId, code, onClose, onCollected, onUnpaid}: {
 saleId: string; code: string; onClose: () => void; onCollected: () => Promise<void>;
 onUnpaid?: () => Promise<void>;
}) {
 const [context, setContext] = useState<PartBillingContext | null>(null);
 const [method, setMethod] = useState<"usd" | "bs" | "mixed">("usd");
 const [usdBase, setUsdBase] = useState("");
 const [paidUsd, setPaidUsd] = useState(""); const [paidBs, setPaidBs] = useState("");
 const [usdAccount, setUsdAccount] = useState(""); const [bsAccount, setBsAccount] = useState("");
 const [reference, setReference] = useState(""); const [error, setError] = useState<string | null>(null);
 const [quote, setQuote] = useState<{key: string; value: PartPaymentQuote} | null>(null);
 const [busy, setBusy] = useState(false);
 const [collected, setCollected] = useState(false);
 const key = JSON.stringify([saleId, method, usdBase]);
 const current = quote?.key === key ? quote.value : null;
 useEffect(() => { let active = true;
  getPartBilling(saleId).then((data) => { if (active) setContext(data); })
   .catch((err) => { if (active) setError(err instanceof Error ? err.message : "No se pudo cargar el cobro."); });
  return () => {active = false;};
 }, [saleId]);
 useEffect(() => { if (!context) return; let active = true;
  setError(null);
  const timer = setTimeout(() => {
   quotePartPayment(saleId, {payment_method: method, usd_base: method === "mixed" ? usdBase || "0" : "0"})
    .then((value) => { if (active) setQuote({key, value}); })
    .catch((err) => { if (active) setError(err instanceof Error ? err.message : "No se pudo calcular el cobro."); });
  }, 200);
  return () => {active = false; clearTimeout(timer);};
 }, [context, saleId, method, usdBase, key]);
 async function submit(unpaid = false) {
  if (busy) return; setBusy(true); setError(null);
  try {
   if (unpaid && onUnpaid) await onUnpaid();
   else {
    if (!current) throw new Error("Espera el cálculo del cobro.");
    if (!collected) {
    await collectPartPayment(saleId, { payment_method: method, usd_base: method === "mixed" ? usdBase : "0",
     paid_usd: method !== "bs" ? paidUsd || "0" : "0", paid_bs: method !== "usd" ? paidBs || "0" : "0",
     usd_account_id: usdAccount || null, bs_account_id: bsAccount || null, payment_reference: reference });
    setCollected(true);
    }
    await onCollected();
   }
   onClose();
  } catch (err) { setError(err instanceof Error ? err.message : "No se pudo registrar el cobro."); }
  finally { setBusy(false); }
 }
 return <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4">
  <div role="dialog" aria-modal="true" aria-label="Registrar cobro" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
   <div className="mb-4 flex justify-between"><h2 className="font-display text-xl font-bold text-navy">Registrar cobro · {code}</h2><button disabled={busy} onClick={onClose} aria-label="Cerrar"><X /></button></div>
   <p className="mb-3 text-sm text-steel">Saldo con IVA: ${context?.pending_amount.toFixed(2) ?? "…"}. Puedes registrar el total o un abono.</p>
   <p className="mb-4 text-xs text-steel">Tasa BCV: {context?.bcv_rate ?? "No disponible"} · {context?.bcv_date ?? ""}. IGTF sobre el monto recibido en USD.</p>
   <fieldset disabled={busy} className="space-y-4">
    <label className="block text-sm">Forma de pago<select value={method} onChange={(e) => {setMethod(e.target.value as typeof method); setPaidUsd(""); setPaidBs("");}} className="mt-1 w-full rounded-xl border p-3"><option value="usd">USD</option><option value="bs">Bs. / Punto / Transferencia</option><option value="mixed">Mixto (USD + Bs.)</option></select></label>
    {method === "mixed" && <label className="block text-sm">Aporte base en USD (sin IGTF)<NumberInput min="0" step="0.01" value={usdBase} onValueChange={setUsdBase} className="mt-1 w-full rounded-xl border p-3" /></label>}
    {current && <p className="text-sm text-steel">IGTF para pago total: ${current.igtf_amount.toFixed(2)} · Total: ${current.total_usd.toFixed(2)}. En un abono se aplica proporcionalmente al USD recibido.</p>}
    <PaymentReceivedFields quote={current} accounts={context?.accounts ?? []} usdAccount={usdAccount} bsAccount={bsAccount} paidUsd={paidUsd} paidBs={paidBs} setUsdAccount={setUsdAccount} setBsAccount={setBsAccount} setPaidUsd={setPaidUsd} setPaidBs={setPaidBs} />
    <label className="block text-sm">Referencia / método (opcional)<input maxLength={60} value={reference} onChange={(e) => setReference(e.target.value)} className="mt-1 w-full rounded-xl border p-3" /></label>
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    <button disabled={busy || !current || !(Number(paidUsd) + Number(paidBs) > 0)} onClick={() => void submit()} className="flex w-full items-center justify-center gap-2 rounded-full bg-blue p-3 font-semibold text-white disabled:opacity-50">{busy && <Loader2 className="h-4 w-4 animate-spin" />}{collected ? "Cobro registrado · Reintentar confirmar entrega" : "Registrar cobro"}</button>
    {onUnpaid && !collected && <button disabled={busy} onClick={() => void submit(true)} className="w-full p-2 text-sm font-semibold text-blue">No pagó · Confirmar y dejar en Cuentas por Cobrar</button>}
   </fieldset>
  </div>
 </div>;
}
