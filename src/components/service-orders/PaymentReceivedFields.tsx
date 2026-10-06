"use client";
import { NumberInput } from "@/components/ui/NumberInput";
const inputClass = "mt-1 w-full rounded-xl border border-navy/15 bg-white px-3 py-2.5 text-sm text-navy disabled:bg-ash";
const usd = (v: number) => `$${v.toFixed(2)}`;
const bs = (v: number) => `Bs. ${v.toFixed(2)}`;
export default function PaymentReceivedFields({quote, accounts, usdAccount, bsAccount, paidUsd, paidBs, setUsdAccount, setBsAccount, setPaidUsd, setPaidBs}: {
 quote: {due_usd: number; due_bs: number} | null;
 accounts: {id: string; name: string; currency: "usd" | "bs"}[];
 usdAccount: string; bsAccount: string; paidUsd: string; paidBs: string;
 setUsdAccount: (v: string) => void; setBsAccount: (v: string) => void;
 setPaidUsd: (v: string) => void; setPaidBs: (v: string) => void;
}) { return <>{quote && (["usd","bs"] as const).filter((currency) => (currency === "usd" ? quote.due_usd : quote.due_bs) > 0).map((currency) => <div key={currency} className="rounded-xl border border-navy/10 p-4"><p className="mb-3 font-semibold text-navy">A cobrar: {currency === "usd" ? usd(quote.due_usd) : bs(quote.due_bs)}</p><label className="block text-sm text-steel">Cuenta receptora ({currency === "usd" ? "USD" : "Bs."})<select value={currency === "usd" ? usdAccount : bsAccount} onChange={(e) => (currency === "usd" ? setUsdAccount : setBsAccount)(e.target.value)} className={inputClass}><option value="">Selecciona una cuenta</option>{accounts.filter((a) => a.currency === currency).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>{!accounts.some((a) => a.currency === currency) && <p className="mt-2 text-xs text-red-600">Registra una cuenta activa en esta moneda en Administración para recibir el pago.</p>}<label className="mt-3 block text-sm text-steel">Monto recibido<NumberInput min="0" step="0.01" value={currency === "usd" ? paidUsd : paidBs} onValueChange={(value) => (currency === "usd" ? setPaidUsd : setPaidBs)(value)} className={inputClass} /></label></div>)}</>; }
