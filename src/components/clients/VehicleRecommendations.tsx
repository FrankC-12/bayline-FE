"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getPendingUpsellsForVehicle, quoteUpsell } from "@/lib/api/upsells";
import type { PendingUpsell } from "@/types/upsells";
export default function VehicleRecommendations({
  vehicleId,
  canCreate,
}: {
  vehicleId: string;
  canCreate: boolean;
}) {
  const [rows, setRows] = useState<PendingUpsell[]>([]),
    [amounts, setAmounts] = useState<Record<string, number | null>>({}),
    [error, setError] = useState("");
  useEffect(() => {
    let live = true;
    getPendingUpsellsForVehicle(vehicleId)
      .then(async (list) => {
        if (live) setRows(list);
        const quotes = await Promise.all(
          list.map(async (u) => {
            try {
              const q = await quoteUpsell(u.id);
              return [
                u.id,
                q.has_work && q.total > 0 ? q.total : null,
              ] as const;
            } catch {
              return [u.id, null] as const;
            }
          }),
        );
        if (live) setAmounts(Object.fromEntries(quotes));
      })
      .catch((e) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, [vehicleId]);
  if (!rows.length && !error) return null;
  return (
    <section className="mt-5 rounded-2xl border border-navy/10 bg-white p-5">
      <h3 className="font-mono text-xs uppercase tracking-widest text-blue">
        Trabajos recomendados pendientes
      </h3>
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      <div className="mt-4 space-y-3">
        {rows.map((u) => (
          <div
            key={u.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-navy/10 p-4"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-navy">{u.title}</p>
              <p className="mt-1 break-words text-xs text-steel">
                {u.description}
              </p>
              <p className="mt-2 text-xs text-steel">
                <Link
                  href={`/dashboard/servicios/${u.service_order_id}`}
                  className="text-blue underline"
                >
                  {u.origin_service_order_code}
                </Link>{" "}
                · {u.status === "pospuesto" ? "Para después" : "Sin respuesta"}{" "}
                ·{" "}
                {amounts[u.id] != null
                  ? `$${amounts[u.id]!.toLocaleString("es-VE", { minimumFractionDigits: 2 })}`
                  : "Revisar cotización"}
              </p>
            </div>
            {canCreate && (
              <Link
                href={`/dashboard/servicios/nueva?vehicle_id=${vehicleId}&upsell_id=${u.id}`}
                className="rounded-full bg-blue px-4 py-2 text-xs font-semibold text-white"
              >
                Crear ODS
              </Link>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
