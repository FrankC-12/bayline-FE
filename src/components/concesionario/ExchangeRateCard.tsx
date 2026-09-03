"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { getLatestExchangeRates, type ExchangeRate } from "@/lib/api/concesionario";

export default function ExchangeRateCard() {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setRates(await getLatestExchangeRates());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const valueDate = rates[0]?.value_date;

  return (
    <section className="mt-6 rounded-2xl border border-navy/10 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-steel">Tasa oficial BCV</p>
          {valueDate && (
            <p className="mt-0.5 text-[11px] text-steel">
              Fecha valor {new Date(`${valueDate}T12:00:00`).toLocaleDateString("es-VE")}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          aria-label="Actualizar tasas mostradas"
          title="Consultar las últimas tasas guardadas"
          className="rounded-lg p-1.5 text-steel transition hover:bg-ash hover:text-blue disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading && rates.length === 0 ? (
        <p className="mt-4 text-xs text-steel">Consultando tasas...</p>
      ) : error ? (
        <p className="mt-4 text-xs text-red-600">No se pudo consultar la tasa.</p>
      ) : rates.length === 0 ? (
        <p className="mt-4 text-xs text-steel">Aún no hay tasas almacenadas.</p>
      ) : (
        <dl className="mt-4 space-y-2">
          {rates
            .slice()
            .sort((a, b) => (a.currency === "USD" ? -1 : b.currency === "USD" ? 1 : 0))
            .map((rate) => (
              <div key={rate.currency} className="flex items-baseline justify-between gap-3">
                <dt className="text-xs font-semibold text-navy">{rate.currency}</dt>
                <dd className="text-right font-mono text-xs font-semibold text-blue">
                  Bs. {rate.rate_ves.toLocaleString("es-VE", { minimumFractionDigits: 4, maximumFractionDigits: 8 })}
                </dd>
              </div>
            ))}
        </dl>
      )}
      <p className="mt-3 border-t border-navy/10 pt-2 text-[10px] leading-relaxed text-steel">
        Fuente: Banco Central de Venezuela
      </p>
    </section>
  );
}
