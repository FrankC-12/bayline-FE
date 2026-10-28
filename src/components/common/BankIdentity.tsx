"use client";
import { useState } from "react";
import { Landmark } from "lucide-react";
import { BANK_LOGO_CODES, findVenezuelanBank } from "@/lib/venezuelan-banks";

export default function BankIdentity({
  name,
  code,
}: {
  name: string;
  code?: string;
}) {
  const bank = findVenezuelanBank(code || name);
  const logo =
    bank && BANK_LOGO_CODES.has(bank.code)
      ? `/assets/banks/${bank.code}.png`
      : null;
  const [failed, setFailed] = useState<string | null>(null);
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-navy/10 bg-white px-3 py-2.5">
      <span className="flex h-12 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-navy/5 bg-white p-1.5">
        {logo && failed !== logo ? (
          <img
            src={logo}
            alt={`Logo de ${bank?.name ?? name}`}
            className="h-full w-full object-contain"
            onError={() => setFailed(logo)}
          />
        ) : (
          <Landmark aria-hidden="true" className="h-6 w-6 text-steel" />
        )}
      </span>
      <div className="min-w-0">
        <p className="break-words text-sm font-semibold text-navy">
          {name || bank?.name || "Banco sin especificar"}
        </p>
        {bank && (
          <p className="mt-0.5 font-mono text-xs text-steel">
            Código {bank.code}
          </p>
        )}
      </div>
    </div>
  );
}
