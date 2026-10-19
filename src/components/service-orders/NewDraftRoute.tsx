"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { createOrderDraft } from "@/lib/api/serviceOrders";
export default function NewDraftRoute() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const started = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!currentUser?.filialId || started.current) return;
    started.current = true;
    const query = new URLSearchParams(window.location.search);
    void createOrderDraft({
      filial_id: currentUser.filialId,
      vehicle_id: query.get("vehicle_id"),
      bay_id: query.get("bay_id"),
      scheduled_at: query.get("scheduled_at"),
      upsell_id: query.get("upsell_id"),
    })
      .then((order) => router.replace(`/dashboard/servicios/${order.id}`))
      .catch((e) => {
        setError(
          e instanceof Error ? e.message : "No se pudo crear el borrador.",
        );
      });
  }, [currentUser?.filialId, router, attempt]);
  return (
    <div className="rounded-2xl border border-navy/10 bg-white p-8">
      <h1 className="font-display text-2xl font-bold text-navy">
        Nueva orden de servicio
      </h1>
      {error ? (
        <>
          <p role="alert" className="mt-4 text-red-700">
            {error}
          </p>
          <button
            className="mt-4 text-blue underline"
            onClick={() => {
              started.current = false;
              setError(null);
              setAttempt((v) => v + 1);
            }}
          >
            Reintentar
          </button>
        </>
      ) : (
        <p className="mt-3 text-sm text-steel">Preparando el borrador…</p>
      )}
    </div>
  );
}
