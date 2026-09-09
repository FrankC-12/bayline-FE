"use client";

import { useEffect, useRef, useState } from "react";
import { X, Loader2, Receipt, CheckCircle2 } from "lucide-react";
import {
  getBillingContext, refreshBillingRate, quoteBilling, issueInvoice, getInvoice, getInvoiceDocument,
  type BillingContext, type BillingQuote, type Invoice, type PaymentMethod,
} from "@/lib/api/serviceOrderBilling";

const usd = (value: number | null | undefined) => `$${(value ?? 0).toFixed(2)}`;
const bs = (value: number) => `Bs. ${value.toLocaleString("es-VE", {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
const inputClass = "mt-1 w-full rounded-xl border border-navy/15 bg-white px-3 py-2.5 text-sm text-navy disabled:bg-ash";

export default function BillingModal({ orderId, orderCode, invoiced, onClose, onInvoiced }: {
  orderId: string; orderCode: string; invoiced: boolean; onClose: () => void; onInvoiced: () => Promise<void>;
}) {
  const [context, setContext] = useState<BillingContext | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("usd");
  const [usdBase, setUsdBase] = useState("");
  const [paidUsd, setPaidUsd] = useState("");
  const [paidBs, setPaidBs] = useState("");
  const [usdAccount, setUsdAccount] = useState("");
  const [bsAccount, setBsAccount] = useState("");
  const [reference, setReference] = useState("");
  const [quote, setQuote] = useState<{ key: string; value: BillingQuote } | null>(null);
  const [revision, setRevision] = useState(0);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [document, setDocument] = useState<{ filename: string; html: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quoteError, setQuoteError] = useState<{key: string; message: string} | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const requestRef = useRef<{key: string; id: string} | null>(null);
  const key = JSON.stringify([orderId, method, usdBase, revision]);
  const current = quote?.key === key ? quote.value : null;

  useEffect(() => {
    let active = true;
    setLoading(true);
    const load = async () => {
      try {
        if (invoiced) {
          const saved = await getInvoice(orderId);
          if (active) setInvoice(saved);
          const file = await getInvoiceDocument(orderId);
          if (active) setDocument(file);
        } else {
          const data = await getBillingContext(orderId);
          if (active) {
            setContext(data);
            for (const currency of ["usd", "bs"] as const) {
              const accounts = data.accounts.filter((a) => a.currency === currency);
              if (accounts.length === 1) (currency === "usd" ? setUsdAccount : setBsAccount)(accounts[0].id);
            }
          }
        }
      } catch (err) { if (active) setError(err instanceof Error ? err.message : "No se pudo cargar la facturación."); }
      finally { if (active) setLoading(false); }
    };
    void load();
    return () => { active = false; };
  }, [orderId, invoiced]);

  useEffect(() => {
    if (!context || invoice || invoiced) return;
    let active = true;
    if (method === "mixed" && (!usdBase || !Number.isFinite(Number(usdBase)) || Number(usdBase) <= 0)) return;
    const timer = setTimeout(() => {
      quoteBilling(orderId, { payment_method: method, usd_base: method === "mixed" ? usdBase : "0" })
        .then((value) => { if (active) { setQuote({key, value}); setQuoteError(null); } })
        .catch((err) => { if (active) setQuoteError({key, message: err instanceof Error ? err.message : "No se pudo calcular el cobro."}); });
    }, 200);
    return () => { active = false; clearTimeout(timer); };
  }, [context, invoice, invoiced, orderId, method, usdBase, key]);

  async function updateRate() {
    setBusy(true); setError(null);
    try { setContext(await refreshBillingRate(orderId)); setRevision((v) => v + 1); }
    catch (err) { setError(err instanceof Error ? err.message : "No se pudo actualizar BCV."); }
    finally { setBusy(false); }
  }

  async function confirmInvoice() {
    if (!current || busy) return;
    const body = { payment_method: method, usd_base: method === "mixed" ? usdBase : "0",
      quote_hash: current.quote_hash, paid_usd: current.due_usd > 0 ? paidUsd : "0",
      paid_bs: current.due_bs > 0 ? paidBs : "0", usd_account_id: current.due_usd > 0 ? usdAccount : null,
      bs_account_id: current.due_bs > 0 ? bsAccount : null, payment_reference: reference };
    const requestKey = JSON.stringify(body);
    if (requestRef.current?.key !== requestKey) requestRef.current = {key: requestKey, id: crypto.randomUUID()};
    setBusy(true); setError(null);
    try {
      let saved: Invoice;
      try { saved = await issueInvoice(orderId, {...body, request_id: requestRef.current.id}); }
      catch (err) {
        // If the response was lost after commit, recover the already-issued invoice.
        const recovered = await getInvoice(orderId).catch(() => null);
        if (!recovered) throw err;
        saved = recovered;
      }
      setInvoice(saved);
      setDocument(await getInvoiceDocument(orderId).catch(() => null));
      await onInvoiced();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar el cobro.");
      setRevision((v) => v + 1);
    } finally { setBusy(false); }
  }

  function download() {
    if (!document) return;
    const url = URL.createObjectURL(new Blob([document.html], {type: "text/html;charset=utf-8"}));
    const a = window.document.createElement("a"); a.href = url; a.download = document.filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function print() {
    if (!document) return;
    const popup = window.open("", "_blank");
    if (!popup) { setError("Permite abrir ventanas para imprimir la factura."); return; }
    popup.opener = null;
    popup.document.write(document.html); popup.document.close(); popup.focus(); popup.print();
  }
  const exact = (received: string, expected: number) => /^\d+(\.\d{1,2})?$/.test(received) && Number.isFinite(Number(received)) && Math.round(Number(received) * 100) === Math.round(expected * 100);
  const canIssue = !!current && (current.due_usd === 0 || (!!usdAccount && exact(paidUsd, current.due_usd))) &&
    (current.due_bs === 0 || (!!bsAccount && exact(paidBs, current.due_bs)));
  const summary = current?.summary ?? context?.summary;

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/50 p-4" role="dialog" aria-modal="true" aria-labelledby="billing-title">
    <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-xl">
      <header className="flex items-center justify-between border-b border-navy/10 p-6">
        <div><p className="text-xs font-semibold uppercase tracking-widest text-blue">{orderCode}</p><h2 id="billing-title" className="mt-1 font-display text-2xl font-bold text-navy">{invoice ? "Factura y comprobante de pago" : "Facturación y cobro"}</h2></div>
        <button type="button" onClick={onClose} disabled={busy} aria-label="Cerrar pantalla de facturación" className="rounded-full p-2 text-steel hover:bg-ash disabled:opacity-50"><X /></button>
      </header>
      {loading ? <p className="p-8 text-center text-steel">Cargando facturación…</p> : invoice ? <div className="space-y-5 p-6">
        <div className="rounded-xl bg-emerald-50 p-5 text-emerald-800"><CheckCircle2 className="mb-2" /><h3 className="font-bold">{invoice.code} · Pago registrado</h3><p>{invoice.client_name} · {invoice.client_document}</p><p className="mt-2 text-2xl font-bold">{usd(invoice.total_usd)}</p><p>Recibido: {usd(invoice.due_usd)} + {bs(invoice.due_bs)}</p></div>
        {!document && <button onClick={async () => { try { setDocument(await getInvoiceDocument(orderId)); setError(null); } catch { setError("No se pudo cargar el documento. Intenta nuevamente."); } }} className="text-sm text-blue underline">Cargar documento de factura</button>}
        <div className="flex flex-wrap gap-3"><button onClick={download} disabled={!document} className="rounded-full bg-blue px-5 py-2 text-white disabled:opacity-50">Descargar documento</button><button onClick={print} disabled={!document} className="rounded-full border border-navy/20 px-5 py-2 text-navy disabled:opacity-50">Imprimir / guardar PDF</button></div>
        <p className="text-sm text-steel">La factura conserva los importes y el pago registrados. El cierre de la orden se realiza por separado desde su pantalla.</p>
        {document && <iframe title="Documento de factura" sandbox="" srcDoc={document.html} className="h-[480px] w-full rounded-xl border border-navy/10" />}
      </div> : <div className="grid gap-6 p-6 md:grid-cols-[1fr_300px]">
        <section className="space-y-5">
          <fieldset disabled={busy}><legend className="mb-2 font-semibold text-navy">Método de pago</legend><div className="grid grid-cols-3 gap-2">{([["usd","USD"],["bs","Bs."],["mixed","Mixto"]] as const).map(([value,label]) => <button type="button" key={value} aria-pressed={method === value} onClick={() => {setMethod(value); setPaidUsd(""); setPaidBs("");}} className={`rounded-xl border px-4 py-3 font-semibold ${method === value ? "border-blue bg-blue-light text-blue" : "border-navy/15 text-steel"}`}>{label}</button>)}</div></fieldset>
          <div className="rounded-xl bg-ash p-4 text-sm"><div className="flex items-center justify-between gap-2"><span className="font-semibold text-navy">Tasa BCV del día</span><button disabled={busy} onClick={updateRate} className="text-blue underline disabled:opacity-50">Actualizar BCV</button></div><p className="mt-1 text-steel">{context?.bcv_rate ? `Bs. ${context.bcv_rate.toLocaleString("es-VE", {minimumFractionDigits: 4, maximumFractionDigits: 8})} por USD · ${context.bcv_date}` : "No hay tasa registrada para hoy. Es necesaria para cobrar en Bs. o mixto."}</p></div>
          {method === "mixed" && <label className="block text-sm font-medium text-navy">USD aplicado a la factura, antes de IGTF<input type="number" min="0.01" step="0.01" value={usdBase} disabled={busy} onChange={(e) => {setUsdBase(e.target.value); setPaidUsd(""); setPaidBs("");}} className={inputClass} /><span className="mt-1 block text-xs font-normal text-steel">El IGTF se suma a este aporte en USD. El resto de la factura se cobra en Bs.</span></label>}
          <fieldset disabled={busy} className="space-y-4"><legend className="mb-2 font-semibold text-navy">Registrar pago recibido</legend>
            {current && (["usd","bs"] as const).filter((currency) => (currency === "usd" ? current.due_usd : current.due_bs) > 0).map((currency) => <div key={currency} className="rounded-xl border border-navy/10 p-4"><p className="mb-3 font-semibold text-navy">A cobrar: {currency === "usd" ? usd(current.due_usd) : bs(current.due_bs)}</p><label className="block text-sm text-steel">Cuenta receptora ({currency === "usd" ? "USD" : "Bs."})<select value={currency === "usd" ? usdAccount : bsAccount} onChange={(e) => (currency === "usd" ? setUsdAccount : setBsAccount)(e.target.value)} className={inputClass}><option value="">Selecciona una cuenta</option>{context?.accounts.filter((a) => a.currency === currency).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>{!context?.accounts.some((a) => a.currency === currency) && <p className="mt-2 text-xs text-red-600">Registra una cuenta activa en esta moneda en Administración para recibir el pago.</p>}<label className="mt-3 block text-sm text-steel">Monto recibido<input type="number" min="0" step="0.01" value={currency === "usd" ? paidUsd : paidBs} onChange={(e) => (currency === "usd" ? setPaidUsd : setPaidBs)(e.target.value)} className={inputClass} /></label></div>)}
            <label className="block text-sm text-steel">Referencia del pago (opcional)<input value={reference} onChange={(e) => setReference(e.target.value)} maxLength={120} className={inputClass} /></label>
          </fieldset>
        </section>
        <aside className="self-start rounded-2xl border border-blue/20 bg-blue-light/30 p-5">
          <Receipt className="mb-3 text-blue"/><h3 className="mb-4 font-semibold text-navy">Desglose de factura</h3><dl className="space-y-3 text-sm text-steel">
            <div className="flex justify-between"><dt>Repuestos</dt><dd>{usd(summary?.parts_subtotal)}</dd></div>
            <div className="flex justify-between"><dt>Mano de obra</dt><dd>{usd(summary?.labor_subtotal)}</dd></div>
            <div className="flex justify-between"><dt>IVA ({summary?.iva_percentage ?? 0}%)</dt><dd>{usd(summary?.iva_amount)}</dd></div>
            <div className="flex justify-between"><dt>IGTF ({current?.igtf_percentage ?? context?.igtf_percentage ?? 0}%)</dt><dd>{current ? usd(current.igtf_amount) : "—"}</dd></div>
            <div className="flex justify-between border-t border-navy/10 pt-3 font-bold text-navy"><dt>Total equivalente USD</dt><dd>{current ? usd(current.total_usd) : "—"}</dd></div>
            {current && <><div className="flex justify-between"><dt>Cobro USD (incluye IGTF)</dt><dd>{usd(current.due_usd)}</dd></div><div className="flex justify-between"><dt>Cobro Bs.</dt><dd>{bs(current.due_bs)}</dd></div></>}
          </dl><p className="mt-4 text-xs text-steel">IGTF aplicado únicamente al aporte en USD. Su porcentaje se configura en Postventa.</p>
          {quoteError?.key === key && <p role="alert" className="mt-4 text-sm text-red-600">{quoteError.message}</p>}
          <button disabled={busy || !canIssue} onClick={confirmInvoice} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-blue px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy && <Loader2 className="h-4 w-4 animate-spin"/>}Confirmar cobro y facturar</button>
          <p className="mt-3 text-xs text-steel">Al confirmar se registra el pago y se congelan los precios. Luego podrás cerrar la orden.</p>
        </aside>
      </div>}
      {error && <p role="alert" className="mx-6 mb-6 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}
    </div>
  </div>;
}
